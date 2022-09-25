import express from "express";
import { tokenVerify } from "@middleware/token";
import { ResponseObject } from "@utils/ResponseController";
import { PrismaClient } from "@prisma/client";

/*
 ************************************
 * _API /api/v1/user                *
 ************************************
 */

const dbclient = new PrismaClient();
const router = express.Router();

router.get("/profile", tokenVerify, async (req, res) => {
  const id = req.profile.id;
  const user = await dbclient.user.findFirst({
    where: {
      profile: {
        id,
      },
    },
    select: {
      createdAt: true,
      email: true,
      updatedAt: true,
      profile: true,
    },
  });
  if (!user) {
    return new ResponseObject(res, false, 400, "User not found");
  }
  return new ResponseObject(res, true, 200, "User infomation in body", {
    user,
  });
});

router.get("/search", tokenVerify, async (req, res) => {
  const query = <string>req.query.query;
  const profiles = await dbclient.profile.findMany({
    where: {
      OR: [
        {
          firstname: {
            contains: query,
          },
        },
        {
          lastname: {
            contains: query,
          },
        },
        {
          username: {
            contains: query,
          },
        },
        {
          user: {
            email: {
              contains: query,
            },
          },
        },
      ],
    },
  });

  if (!profiles) {
    return res.json({
      ok: false,
      error: {
        message: "User not found",
      },
    });
  }

  return res.json({
    ok: true,
    data: {
      profiles,
    },
  });
});

export { router as userRouter };
