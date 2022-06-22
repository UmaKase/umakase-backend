import express from "express";
import { tokenVerify } from "../middleware/token";
import { dbclient } from "../server";
const router = express.Router();

router.get("/profile", tokenVerify, async (req, res) => {
  const id = req.profile.id;
  const user = await dbclient.user.findFirst({
    where: {
      profile: {
        id,
      },
    },
    // include: {
    // 	profile: true
    // },
    select: {
      createdAt: true,
      email: true,
      updatedAt: true,
      profile: true,
    },
  });
  if (!user) {
    return res.json({
      ok: false,
      error: {
        message: "User not found",
      },
    });
  } else {
    return res.json({
      ok: true,
      data: {
        user,
      },
    });
  }
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
