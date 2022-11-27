import express from "express";
import { tokenVerify } from "@middleware/token";
import { Responser } from "@utils/ResponseController";
import { PrismaClient } from "@prisma/client";
import { Log } from "@utils/Log";
import { body, validationResult } from "express-validator";
import HttpStatusCode from "@utils/httpStatus";
import { checkLogin } from "@utils/_";

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
router.put(
  "/profile/email",
  tokenVerify,
  body("email").isEmail().withMessage("Email not valid"),
  async (req, res) => {
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
  }
);

/**
 * _PUT Update User First-Last Name
 * @Body string firstname
 * @Body string lastname
 */
router.put("/profile", tokenVerify, async (req, res) => {
  const profile = await prisma.profile.findFirst({
    where: {
      id: req.profile.id,
    },
  });

  if (!profile) {
    return Responser(res, HttpStatusCode.UNAUTHORIZED, "No Token or User'id error");
  }

  const firstname = <string>req.body.firstname || profile.firstname;
  const lastname = <string>req.body.lastname || profile.lastname;

  try {
    await prisma.profile.update({
      where: {
        id: req.profile.id,
      },
      data: {
        firstname,
        lastname,
      },
    });
  } catch (_) {
    new Log().error("Update user infomation error");
    return Responser(res, HttpStatusCode.BAD_REQUEST, "Update user infomation error");
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
 * Both infomation is stored in SecureStore when user register new tmpUser
 */
router.post("/tmp/merge", tokenVerify, async (req, res) => {
  // If new user is valid
  const toMergeUser = await prisma.profile.findFirst({
    where: {
      id: req.profile.id,
    },
  });
  if (!toMergeUser) {
    return Responser(
      res,
      HttpStatusCode.UNAUTHORIZED,
      "New user is not craeted correctly, please contact developer"
    );
  }
  const tmpId = req.body.tmpId;
  const tmpPass = req.body.tmpPass;

  // If tmpUser is valid
  const [tmpUser, httpCode, messageOrError] = await checkLogin(tmpId, tmpPass);
  if (!tmpUser) {
    return Responser(res, httpCode, messageOrError);
  }

  // get tmp user's room and foods
  const tmpUserRoom = await prisma.room.findFirst({
    where: {
      creator: {
        id: tmpUser.profile!.id,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!tmpUserRoom) {
    return Responser(
      res,
      HttpStatusCode.BAD_REQUEST,
      "Temporary user's default room not found"
    );
  }
  try {
    await prisma.room.update({
      where: {
        id: tmpUserRoom.id,
      },
      data: {
        creator: {
          update: toMergeUser,
        },
      },
    });
    return Responser(res, HttpStatusCode.OK, "User Merged");
  } catch (error) {
    // TODO: Fix Error Code
    return Responser(
      res,
      HttpStatusCode.BAD_GATEWAY,
      "Unexpected Error. Plese report error to developer. Error Code: E001"
    );
  }
});

export { router as userRouter };
