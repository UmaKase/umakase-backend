import express from "express";
import bcrypt from "bcrypt";
import { tokenVerify } from "@middleware/token";
import { Responser } from "@utils/ResponseController";
import { PrismaClient } from "@prisma/client";
import { Log } from "@utils/Log";
import { body, validationResult } from "express-validator";
import HttpStatusCode from "@utils/httpStatus";
import { checkLogin } from "@utils/_";
import { BSalt } from "@config/config";

/*
 ************************************
 * _API /api/v1/user                *
 ************************************
 */

const prisma = new PrismaClient();
const router = express.Router();

/**
 * _GET Get User Profile
 */
router.get("/profile", tokenVerify, async (req, res) => {
  const id = req.profile.id;
  const user = await prisma.user.findFirst({
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
    return Responser(res, HttpStatusCode.UNAUTHORIZED, "User not found");
  }
  return Responser(res, HttpStatusCode.OK, "User infomation in body", {
    user,
  });
});

/**
 * _PUT Update User Email
 * @Body string email - new email
 */
router.put("/profile/email", tokenVerify, body("email").isEmail().withMessage("Email not valid"), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return Responser(res, HttpStatusCode.BAD_REQUEST, "Input validation error", {
      error: errors.array(),
    });
  }
  const profile = await prisma.profile.findFirst({
    where: { id: req.profile.id },
    include: { user: true },
  });

  if (!profile) {
    return Responser(res, HttpStatusCode.UNAUTHORIZED, "User not found!");
  }

  const email = req.body.email;
  try {
    await prisma.user.update({
      where: {
        id: profile.user.id,
      },
      data: { email },
    });
  } catch (_) {
    new Log().error("Update Email Failed");
    return Responser(res, HttpStatusCode.BAD_REQUEST, "Update failed");
  }

  return Responser(res, HttpStatusCode.OK, "Updated Successfully");
});

/**
 * _PUT Update User First-Last Name
 * @Body string firstname
 * @Body string lastname
 * @Body string password
 * @Body string oldPassword - needed if changing password
 */
router.put("/profile", tokenVerify, async (req, res) => {
  const profile = await prisma.profile.findFirst({
    where: {
      id: req.profile.id,
    },
    include: {
      user: true,
    },
  });

  if (!profile) {
    return Responser(res, HttpStatusCode.UNAUTHORIZED, "No Token or User'id error");
  }

  const firstname = <string>req.body.firstname || profile.firstname;
  const lastname = <string>req.body.lastname || profile.lastname;
  const password = <string>req.body.password;
  const oldPassword = <string>req.body.oldPassword;

  await unwrap(
    prisma.profile.update({
      where: {
        id: req.profile.id,
      },
      data: {
        firstname,
        lastname,
      },
    }),
    () => {
      new Log().error("Update user infomation error");
      return Responser(res, HttpStatusCode.BAD_REQUEST, "Update user infomation error");
    }
  );

  if (password) {
    if (!oldPassword) {
      return Responser(res, HttpStatusCode.BAD_REQUEST, "Old password is required");
    }

    // check if oldPassword is correct with bcrypt
    const isCorrect = await bcrypt.compare(oldPassword, profile.user.password);

    if (!isCorrect) {
      return Responser(res, HttpStatusCode.BAD_REQUEST, "Old password is incorrect");
    }

    // hash new password
    const hashedPassword = await bcrypt.hash(password, BSalt);

    await unwrap(
      prisma.user.update({
        where: {
          id: profile.user.id,
        },
        data: {
          password: hashedPassword,
        },
      }),
      () => {
        new Log().error("Update user infomation error");
        return Responser(res, HttpStatusCode.BAD_REQUEST, "Update user infomation error");
      }
    );
  }

  return Responser(res, HttpStatusCode.OK, "Updated");
});

/**
 * _GET Search for user
 * @Query string query - search term
 */
router.get("/search", tokenVerify, async (req, res) => {
  const query = <string>req.query.query;
  const profiles = await prisma.profile.findMany({
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
    return Responser(res, HttpStatusCode.UNAUTHORIZED, "User not found");
  }

  return Responser(res, HttpStatusCode.OK, "Found!", { profiles });
});

/**
 * @body string tmpId - tmp user's id
 * @body string tmpPass - tmp user's password
 * FIXME Make the room 1st room
 * Both infomation is stored in SecureStore when user register new tmpUser
 */
router.post("/tmp/merge", tokenVerify, async (req, res) => {
  // If new user is valid
  const toMergeUser = await prisma.profile.findFirst({
    where: {
      id: req.profile.id,
    },
    include: {
      rooms: true,
    },
  });
  if (!toMergeUser) {
    return Responser(res, HttpStatusCode.UNAUTHORIZED, "New user is not created correctly, please contact developer");
  }
  const tmpId = req.body.tmpId;
  const tmpPass = req.body.tmpPass;

  // If tmpUser is valid
  const [tmpUser, httpCode, messageOrError] = await checkLogin(tmpId, tmpPass);
  if (!tmpUser) {
    return Responser(res, httpCode, messageOrError);
  }

  // get tmp user's created room
  const tmpUserDefaultRoom = await prisma.room.findFirst({
    where: {
      creator: {
        id: tmpUser.profile!.id,
      },
      name: "__default",
    },
  });

  if (!tmpUserDefaultRoom) {
    return Responser(res, HttpStatusCode.BAD_REQUEST, "Temporary user's default room not found");
  }
  // SECTION Merging
  // get tmp user's foods
  const tmpUserFoods = await prisma.foodsOnRooms.findMany({
    where: {
      roomId: tmpUserDefaultRoom.id,
    },
  });

  // Copy tmp user's foods to new user
  await prisma.foodsOnRooms.createMany({
    data: tmpUserFoods.map((food) => ({
      foodId: food.foodId,
      roomId: toMergeUser.rooms[0].roomId,
    })),
    skipDuplicates: true,
  });
  // get merged user's foods
  const mergedUser = await prisma.profile.findFirst({
    where: {
      id: toMergeUser.id,
    },
    include: {
      rooms: true,
    },
  });

  return Responser(res, HttpStatusCode.OK, "User Merged", {
    mergedUser,
  });
});

export { router as userRouter };
