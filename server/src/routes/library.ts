import { PrismaClient } from "@prisma/client";
import express, { Response } from "express";
import { tokenVerify } from "../middleware/token";
import { ResponseObject } from "../utils/ResponseController";
const router = express.Router();

const prisma = new PrismaClient();

// Add Food To Room
router.post("/room", tokenVerify, async (req, res) => {
  const foodIds: string[] = req.body.foodIds;
  const roomId = req.body.roomId;

  const updatedRoom = await prisma.room.update({
    where: { id: roomId },
    data: {
      foods: {
        connect: foodIds.map((id) => ({
          roomId_foodId: {
            foodId: id,
            roomId,
          },
        })),
      },
    },
  });

  return new ResponseObject(res, true, 200, "Success", updatedRoom).send();
});

export { router as libraryRouter };
