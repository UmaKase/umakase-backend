import { roomHelper } from "@utils/roomHelper";
import { PrismaClient, Profile, Room } from "@prisma/client";
import express from "express";
import { tokenVerify } from "@middleware/token";
import { Responser } from "@utils/ResponseController";
import { Log } from "@utils/Log";
import HttpStatusCode from "@utils/httpStatus";

/*
 ************************************
 * _API /api/v1/room                *
 ************************************
 */

const router = express.Router();
const prisma = new PrismaClient({
  log: ["query", "info"],
});
const log = new Log();

/**
 * _GET User's Rooms
 */
router.get("/", tokenVerify, async (req, res) => {
  const userProfile = await prisma.profile.findFirst({
    where: {
      id: req.profile.id,
    },
    include: {
      rooms: {
        select: {
          room: {
            select: {
              name: true,
              id: true,
              user: {
                select: {
                  profile: true,
                },
              },
            },
          },
        },
        // User Default Room Will Always at index 0
        orderBy: {
          joinedAt: "asc",
        },
      },
    },
  });

  if (!userProfile) {
    return Responser(res, HttpStatusCode.UNAUTHORIZED, "Authorization Error | User Id Problem");
  }

  return Responser(res, HttpStatusCode.OK, "Found room", {
    rooms: userProfile.rooms,
  });
});

// _GET Room Info
router.get("/info/:id", tokenVerify, async (req, res) => {
  const id: string = req.params.id;
  const room = await prisma.room.findFirst({
    where: {
      id,
    },
    include: {
      foods: {
        select: {
          food: true,
          foodId: false,
          roomId: false,
        },
      },
      user: {
        include: {
          profile: true,
        },
      },
      _count: true,
    },
  });
  if (!room) {
    return Responser(res, HttpStatusCode.BAD_REQUEST, "Room not found");
  }

  return Responser(res, HttpStatusCode.OK, "success", { room });
});

/*
 * _POST Create A Room
 * @body string    name
 * @body string[]  roomies - username[],
 * @body boolean   isDefaultRoom - default is false
 * @body string[]  foodIds. if isDefaultRoom is true
 */
router.post("/new", tokenVerify, async (req, res) => {
  const name: string = req.body.name;
  let roomieNames: string[] = req.body.roomies || []; // NOTE ** Not INCLUDED** create user's username.
  const foodIds: string[] = req.body.foodIds;
  const isDefaultRoom: boolean = req.body.isDefaultRoom || false;

  const creator:
    | (Profile & {
        createdRooms: Room[];
      })
    | null = await prisma.profile.findFirst({
    where: { id: req.profile.id },
    include: {
      createdRooms: true,
    },
  });

  if (!creator) {
    return Responser(res, HttpStatusCode.UNAUTHORIZED, "User Not Found! or Authentication error");
  }

  roomieNames.push(creator.username);

  if (creator.createdRooms.length > 2) {
    // TODO Check if User is Premium user?
    // -------------------
    // Normal user can only able to create two room
    return Responser(res, HttpStatusCode.FORBIDDEN, "You can only create one room");
  }

  const roomies = await roomHelper.getUserProfiles(roomieNames);

  let foodToAdd: string[] = foodIds;
  if (!isDefaultRoom) {
    foodToAdd = roomHelper.mergeFoodByRoommateIds(roomies);
  }

  const newRoom = await prisma.room.create({
    data: {
      name,
      creator: {
        connect: {
          id: creator.id,
        },
      },
      foods: {
        create: foodToAdd.map((id) => ({
          food: {
            connect: {
              id,
            },
          },
        })),
      },
      user: {
        create: roomieNames.map((username) => ({
          profile: {
            connect: { username },
          },
        })),
      },
    },
    include: {
      foods: {
        select: {
          foodId: false,
          roomId: false,
          food: true,
        },
      },
      user: {
        select: {
          profileId: false,
          roomId: false,
          profile: true,
        },
      },
    },
  });

  return Responser(res, HttpStatusCode.OK, "created successfully", {
    newRoom,
  });
});

router.put("/update/:roomId", tokenVerify, async (req, res) => {
  const user = await prisma.profile.findFirst({
    where: {
      id: req.profile.id,
    },
  });

  if (!user) {
    return Responser(res, HttpStatusCode.UNAUTHORIZED, "Authorization Error");
  }

  const roomId = req.params.roomId;

  const name = req.body.name;
  try {
    await prisma.room.update({
      where: {
        id: roomId,
      },
      data: {
        name,
      },
    });
    return Responser(res, HttpStatusCode.OK, "Room updated");
  } catch (error) {
    log.error(error);
    return Responser(res, HttpStatusCode.BAD_REQUEST, "Room not found or already deleted");
  }
});

/**
 * _POST Add food to room
 * @Body string[] foodIds
 * @Body string roomId
 */
router.post("/add-food", tokenVerify, async (req, res) => {
  const foodIds: string[] = req.body.foodIds || [];

  // Validate user
  const profile = await prisma.profile.findFirst({
    where: { id: req.profile.id },
    include: {
      createdRooms: {
        take: 1,
        orderBy: {
          createdAt: "asc",
        },
      },
      rooms: {
        where: {
          room: {
            name: {
              not: "__default",
            },
          },
        },
        select: {
          roomId: false,
          profileId: false,
          room: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });
  if (!profile) {
    return Responser(res, HttpStatusCode.UNAUTHORIZED, "Unauthorized or profile invalid");
  }

  if (profile.createdRooms.length <= 0) {
    return Responser(res, HttpStatusCode.BAD_REQUEST, "Can't find any room");
  }

  // Validate food
  const foods = await prisma.food.findMany({
    where: {
      id: {
        in: foodIds,
      },
    },
  });
  if (foods.length <= 0) {
    return Responser(res, HttpStatusCode.BAD_REQUEST, "Can't find any food");
  }

  // Add food to room
  const addedFoods = await prisma.room.update({
    where: {
      id: profile.createdRooms[0].id,
    },
    data: {
      foods: {
        createMany: {
          data: foodIds.map((id) => ({
            foodId: id,
          })),
          skipDuplicates: true,
        },
      },
    },
  });

  // Trigger other room to update their food
  try {
    await Promise.all(
      profile.rooms.map(async (room) => {
        roomHelper.triggerUpdateRoomFood(room.room);
      })
    );
  } catch (error) {
    log.error(error.message);
  }

  return Responser(res, HttpStatusCode.OK, "Added foods to room", { addedFoods });
});

/**
 * @Body Event event
 * @Body string roomId
 * @Body string[] newRoomies - new roommate usernames if it is add-member event
 * @Body string[] removeRoomies - remove roommate usernames if it is remove-member event
 */
router.post("/event", tokenVerify, async (req, res) => {
  const event = req.body.event;
  const roomId = req.body.roomId;

  if (!roomHelper.isRoomEvent(event)) {
    return Responser(res, HttpStatusCode.BAD_REQUEST, "No Event or Invalid Room Event");
  }

  const room = await prisma.room.findFirst({
    where: { id: roomId },
    include: {
      user: {
        where: {
          profileId: req.profile.id,
        },
      },
    },
  });

  if (!room) {
    return Responser(res, HttpStatusCode.BAD_REQUEST, "Room not found");
  }

  let [result, error, data] = [false, "", undefined];
  switch (event) {
    case "add-member":
      const newRoomies = req.body.newRoomies;
      if (!newRoomies) {
        break;
      }
      [result, error, data] = await roomHelper.addRoomMember(roomId, newRoomies);

      return Responser(res, result ? HttpStatusCode.OK : HttpStatusCode.BAD_REQUEST, error, data);
    case "remove-member":
      const removeRoomies = req.body.removeRoomies;
      if (!removeRoomies) {
        break;
      }
      [result, error, data] = await roomHelper.removeRoomMember(roomId, removeRoomies);

      return Responser(res, result ? HttpStatusCode.OK : HttpStatusCode.BAD_REQUEST, error, data);
    case "update-food":
      // User add food to room

      break;

    default:
      // code not expected to goes here
      return Responser(res, HttpStatusCode.BAD_REQUEST, "No Event or Invalid Room Event");
  }

  log.error(`\n\tRoom Event: ${event} | Payload: ${JSON.stringify(req.body)}`, `Error: ${error}`, data);

  return Responser(res, HttpStatusCode.BAD_REQUEST, "Input not enough, please report to admin");
});

export { router as roomRouter };
