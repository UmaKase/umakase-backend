import express from "express";
import bcrypt from "bcrypt";
import { body, validationResult } from "express-validator";
import { accessTokenSecret, accessToken_Exp, BSalt, refreshTokenSecret, refreshToken_Exp } from "@config/config";
import jwt from "jsonwebtoken";
import { PrismaClient, Profile, User } from "@prisma/client";
import { createTempUser } from "@utils/tmpUser";
import { Responser } from "@utils/ResponseController";
import { jwtDecode, jwtVerify } from "@utils/jwtController";
import { roomHelper } from "@roomHelper";
import HttpStatusCode from "@utils/httpStatus";

const dbclient = new PrismaClient();

const router = express.Router();

// SECTION Register
router.post(
  "/register",
  // Input validation
  // NOTE even if creating a tmp account. YOU STILL NEED TO SEND EMAIL
  // just send random thing, server will ignore it
  body("email").isEmail().withMessage("Email is not valid"),
  body("username").isLength({ min: 5, max: undefined }).withMessage("Username must be at least 5 characters long"),
  body("password").isLength({ min: 5 }).withMessage("Password must have at least 5 characters"),
  async (req, res) => {
    const { email, username, password, firstname, lastname, isTemp, foodIds } = req.body;

    // Create a temp user and send its id and password to client
    if (isTemp) {
      const { tmpId, tmpPass } = await createTempUser();
      if (tmpId) {
        const defaultRoom = await roomHelper.createDefaultRoom(tmpId, foodIds);
        return Responser(res, HttpStatusCode.OK, "created", {
          tmpId,
          tmpPass,
          defaultRoom,
        });
      }
    }

    // Finds the validation errors in this request and wraps them in an object with handy functions
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return Responser(res, HttpStatusCode.BAD_REQUEST, "Input validation error", {
        error: errors.array(),
      });
    }

    // ANCHOR Check If Email or Username Existed
    const users = await dbclient.user.findMany({
      where: {
        OR: [
          {
            email,
          },
          {
            profile: {
              username,
            },
          },
        ],
      },
    });

    if (users.length > 0) {
      return Responser(res, HttpStatusCode.BAD_REQUEST, "Email or Username already in use");
    }

    // ANCHOR Start inserting data
    // hashing password
    const hashedPassword = await bcrypt.hash(password, BSalt);
    await dbclient.user.create({
      data: {
        email,
        password: hashedPassword,
        profile: {
          create: {
            username,
            firstname,
            lastname,
          },
        },
      },
    });

    // TODO Merge user if user was tmpUser
    // if (wasTempUser) {
    //    userHelper.mergeTempUser()
    // }

    const defaultRoom = await roomHelper.createDefaultRoom(username, foodIds);

    return Responser(res, HttpStatusCode.OK, "success", {
      defaultRoom,
    });
  }
);
// !SECTION

// SECTION Login Route
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  //ANCHOR Check If Email Existed
  const user:
    | (User & {
        profile: Profile | null;
      })
    | null = await dbclient.user.findFirst({
    where: {
      profile: { username },
    },
    include: {
      profile: true,
    },
  });

  if (!user) {
    return Responser(res, HttpStatusCode.BAD_REQUEST, "User not found!");
  }

  // ANCHOR 2 filter : Password validation
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return Responser(res, HttpStatusCode.BAD_REQUEST, "Username or password not correct");
  }
  //ANCHOR Success sending JWT
  const accessToken: string = jwt.sign({ id: user.profile?.id }, accessTokenSecret!, {
    expiresIn: accessToken_Exp,
  });
  const refreshToken: string = jwt.sign({ id: user.profile?.id }, refreshTokenSecret!, {
    expiresIn: refreshToken_Exp,
  });
  let newRefreshToken: string[];
  //process refreshToken saving
  if (!user.refreshToken) {
    newRefreshToken = [refreshToken];
  } else {
    newRefreshToken = JSON.parse(user.refreshToken);
    newRefreshToken.push(refreshToken);
  }

  await dbclient.user.update({
    where: {
      email: user.email || undefined,
      tmpId: user.tmpId || undefined,
    },
    data: {
      refreshToken: JSON.stringify(newRefreshToken),
    },
    include: {
      profile: true,
    },
  });

  return Responser(res, HttpStatusCode.OK, "Valid email & password.", {
    accessToken: accessToken,
    refreshToken: refreshToken,
  });
});
// !SECTION

// ANCHOR Access token validation
router.post("/token/access", async (req, res) => {
  //check if the req.headers["authorization"] exist
  if (!req.headers["authorization"]) {
    return Responser(res, HttpStatusCode.UNAUTHORIZED, "Auth header not provided");
  }

  const authHeader: string = req.headers["authorization"];
  // //getting authMethod and accessToken from the authHeader
  const authMethod: string = authHeader.split(" ")[0]; //authMethod == Bearer
  const accessToken: string = authHeader.split(" ")[1];

  //check is the authMethod & accessToken exist and the is method correct
  if (!authMethod || !accessToken || authMethod !== "Bearer") {
    return Responser(res, HttpStatusCode.UNAUTHORIZED, "Auth method is invalid");
  }

  const token = jwtVerify<AccessToken>(accessToken, accessTokenSecret);
  if (!token) {
    return Responser(res, HttpStatusCode.UNAUTHORIZED, "Token is invalid");
  }

  return Responser(res, HttpStatusCode.OK, "Token is valid");
});

// SECTION Refresh token validation || Create new access token using refresh token
router.post("/token/refresh", async (req, res) => {
  //check if the req.headers["authorization"] exist
  if (!req.headers["authorization"]) {
    return Responser(res, HttpStatusCode.BAD_REQUEST, "Error : Missing Authorization Header provided!");
  }

  const authHeader: string = req.headers["authorization"];
  //getting authMethod and accessToken from the authHeader
  const authMethod: string = authHeader.split(" ")[0]; //authMethod == Bearer
  const refreshToken: string = authHeader.split(" ")[1];

  //check is the authMethod & accessToken exist and the is method correct
  if (!authMethod || !refreshToken || authMethod !== "Bearer") {
    return Responser(res, HttpStatusCode.BAD_REQUEST, "Auth method is invalid");
  }

  //verify refreshToken
  const refreshTokenPayloads = jwtVerify<RefreshToken>(refreshToken, refreshTokenSecret);
  if (!refreshTokenPayloads) {
    return Responser(res, HttpStatusCode.UNAUTHORIZED, "Token is invalid");
  }
  const refreshTokenCheck = await dbclient.user.findFirst({
    where: {
      profile: {
        id: refreshTokenPayloads.id,
      },
    },
  });
  //check if user exist
  if (!refreshTokenCheck) {
    return Responser(res, HttpStatusCode.UNAUTHORIZED, "User not existed");
  }
  //check if the refresh token is in the database refresh token string array
  const refreshTokenList = JSON.parse(refreshTokenCheck.refreshToken || "[]") as string[];
  if (!refreshTokenList.includes(refreshToken)) {
    return Responser(res, HttpStatusCode.UNAUTHORIZED, "Token is not in the list");
  }
  //the refresh token is valid so create and return a new access token
  const userInfo = { id: refreshTokenPayloads.id };
  const newAccessToken = jwt.sign(userInfo, accessTokenSecret!, {
    expiresIn: accessToken_Exp,
  });
  return Responser(res, HttpStatusCode.OK, "Refresh token valid, new access token in reps", { newAccessToken });
});
// !SECTION

// SECTION LogOut
router.post("/token/logout", async (req, res) => {
  //check if the req.headers["authorization"] exist
  if (!req.headers["authorization"]) {
    return Responser(res, HttpStatusCode.BAD_REQUEST, "Error : Missing Authorization Header provided!");
  }

  const authHeader: string = req.headers["authorization"];
  //getting authMethod and accessToken from the authHeader
  const authMethod: string = authHeader.split(" ")[0]; //authMethod == Bearer
  const refreshToken: string = authHeader.split(" ")[1];

  //check is the authMethod & accessToken exist and the is method correct
  if (!authMethod || !refreshToken || authMethod !== "Bearer") {
    return Responser(res, HttpStatusCode.BAD_REQUEST, "Auth method is invalid");
  }

  //get the refreshToken list from database by tokenPoayloads id
  const refreshTokenPayloads = jwtDecode<RefreshToken>(refreshToken);

  if (!refreshTokenPayloads) {
    return Responser(res, HttpStatusCode.UNAUTHORIZED, "Refresh Token not valid");
  }
  const user = await dbclient.user.findFirst({
    where: {
      profile: {
        id: refreshTokenPayloads.id,
      },
    },
  });
  //if no user
  if (!user) {
    return Responser(res, HttpStatusCode.UNAUTHORIZED, "Error : User not exist!");
  }
  //check is the token in the list or not
  let refreshTokenList = JSON.parse(user.refreshToken || "[]") as string[];
  //not in the list
  if (!refreshTokenList.includes(refreshToken)) {
    return Responser(res, HttpStatusCode.UNAUTHORIZED, "Refresh token is not valid");
  }
  //in the list
  refreshTokenList = refreshTokenList.filter((token) => token != refreshToken);
  //create a update user form
  await dbclient.user.update({
    where: {
      id: user.id,
    },
    data: {
      refreshToken: JSON.stringify(refreshTokenList),
    },
  });
  return Responser(res, 200, "Refresh token removed.");
});
// !SECTION

export { router as authRouter };
