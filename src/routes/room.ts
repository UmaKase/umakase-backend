import { helper } from "@utils/roomHelper";
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
const prisma = new PrismaClient();
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
      room: {
        select: {
          room: {
            select: {
              name: true,
              id: true,
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
    return Responser(
      res,
      HttpStatusCode.UNAUTHORIZED,
      "Authorization Error | User Id Problem"
    );
  }

  return Responser(res, HttpStatusCode.OK, "Found room", {
    rooms: userProfile.room,
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
        include: {
          food: true,
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
 * @body string[]  foodIds.
 */
router.post("/new", tokenVerify, async (req, res) => {
  const name: string = req.body.name;
  const roomieNames: string[] = req.body.roomies || []; // NOTE **INCLUDED** create user's username.
  const foodIds: string[] = req.body.foodIds;
  const isDefaultRoom: boolean = req.body.isDefaultRoom || false;

  const creator:
    | (Profile & {
        createdRoom: Room[];
      })
    | null = await prisma.profile.findFirst({
    where: { id: req.profile.id },
    include: {
      createdRoom: true,
    },
  });

  if (!creator) {
    return Responser(
      res,
      HttpStatusCode.UNAUTHORIZED,
      "User Not Found! or Authentication error"
    );
  }

  if (creator.createdRoom.length > 2) {
    // TODO Check if User is Premium user?
    // -------------------
    // Normal user can only able to create two room
    return Responser(
      res,
      HttpStatusCode.FORBIDDEN,
      "You can only create one room"
    );
  }

  const roomies = await helper.getUserProfiles(roomieNames);

  let foodToAdd: string[] = foodIds;
  if (!isDefaultRoom) {
    foodToAdd = helper.mergeFoodByRoommateIds(roomies);
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
    return Responser(
      res,
      HttpStatusCode.BAD_REQUEST,
      "Room not found or already deleted"
    );
  }
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

  if (!helper.isRoomEvent(event)) {
    return Responser(
      res,
      HttpStatusCode.BAD_REQUEST,
      "No Event or Invalid Room Event"
    );
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
      [result, error, data] = await helper.addRoomMember(roomId, newRoomies);

      return Responser(
        res,
        result ? HttpStatusCode.OK : HttpStatusCode.BAD_REQUEST,
        error,
        data
      );
    case "remove-member":
      const removeRoomies = req.body.removeRoomies;
      if (!removeRoomies) {
        break;
      }
      [result, error, data] = await helper.removeRoomMember(
        roomId,
        removeRoomies
      );

      return Responser(
        res,
        result ? HttpStatusCode.OK : HttpStatusCode.BAD_REQUEST,
        error,
        data
      );
    case "update-food":
      break;

    default:
      // code not expected to goes here
      return Responser(
        res,
        HttpStatusCode.BAD_REQUEST,
        "No Event or Invalid Room Event"
      );
  }

  log.error(
    `\n\tRoom Event: ${event} | Payload: ${JSON.stringify(req.body)}`,
    `Error: ${error}`,
    data
  );
  return Responser(
    res,
    HttpStatusCode.BAD_REQUEST,
    "Input not enough, please report to admin"
  );
});

export { router as roomRouter };
