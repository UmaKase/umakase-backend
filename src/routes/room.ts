import { helper } from "@helper";
import { PrismaClient, Profile, Room } from "@prisma/client";
import express from "express";
import { tokenVerify } from "@middleware/token";
import { ResponseObject } from "@utils/ResponseController";
import { Log } from "@utils/Log";

/*
 ************************************
 * _API /api/v1/room                *
 ************************************
 */

const router = express.Router();
const prisma = new PrismaClient();

// _GET Room Info
router.get("/info/:id", tokenVerify, async (req, res) => {
  const id: string = req.params.id;
  const room = await prisma.room.findFirst({
    where: { id },
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

  return new ResponseObject(res, true, 200, "success", { room });
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
    return new ResponseObject(
      res,
      false,
      400,
      "User Not Found! or Authentication error"
    );
  }

  if (creator.createdRoom.length > 2) {
    // TODO Check if User is Premium user?
    // -------------------
    // Normal user can only able to create two room
    return new ResponseObject(res, false, 400, "You can only create one room");
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
        },
        include: { food: true },
      },
      user: {
        select: {
          profileId: false,
          roomId: false,
        },
        include: { profile: true },
      },
    },
  });

  return new ResponseObject(res, true, 200, "created successfully", {
    newRoom,
  });
});

/**
 * _POST Add Food To Room
 * @body  foodIs
 * @body  roomId
 */
router.post("/add", tokenVerify, async (req, res) => {
  const foodIds: string[] = req.body.foodIds;
  const roomId: string = req.body.roomId;

  try {
    const room = await prisma.room.update({
      where: {
        id: roomId,
      },
      data: {
        foods: {
          create: foodIds.map((id) => ({
            food: {
              connect: {
                id,
              },
            },
          })),
        },
      },
    });

    return new ResponseObject(res, true, 200, "Added Successfully", {
      room,
    });
  } catch (e) {
    new Log().error(e);
    return new ResponseObject(
      res,
      false,
      400,
      "Add foods failed. Check food Id or room Id"
    );
  }
});

export { router as roomRouter };
