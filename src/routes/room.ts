import { PrismaClient, Profile, Room } from "@prisma/client";
import express from "express";
import { tokenVerify } from "../middleware/token";

const router = express.Router();

const prisma = new PrismaClient();

// _GET Room Info
router.get("/info/:id", tokenVerify, async (req, res) => {
  const id = req.params.id;
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

  return res.json({
    ok: true,
    data: {
      room,
    },
  });
});

// _POST Create A Room
// @Body: {string}name, {string[]}roomieNames - username[], {string[]}foodIds.
router.post("/new", tokenVerify, async (req, res) => {
  const name: string = req.body.name;
  const roomieNames: string[] = req.body.roomie; // NOTE **INCLUDED** user username. Can be one use only room
  const foodIds: string[] = req.body.foodIds;

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
    return res.json({
      ok: false,
      error: {
        message: "User Not Found! or Authentication error",
      },
    });
  }

  if (creator.createdRoom.length > 2) {
    // Check if User is Premium user?
    // -------------------
    // Normal user can only able to create two room
    return res.json({
      ok: false,
      error: {
        message: "You can only create one room",
      },
    });
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
        create: foodIds.map((id) => ({
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
        include: { food: true },
      },
      user: {
        include: { profile: true },
      },
    },
  });

  return res.json({
    ok: true,
    data: { newRoom },
  });
});

export { router as roomRouter };
