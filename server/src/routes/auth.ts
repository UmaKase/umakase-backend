import express from "express";
import bcrypt from "bcrypt";
import { body, validationResult } from "express-validator";
import { dbclient } from "../server";
import {
  accessTokenSecret,
  accessToken_Exp,
  BSalt,
  refreshTokenSecret,
  refreshToken_Exp,
} from "../config/config";
import jwt from "jsonwebtoken";
import { jwtDecode, jwtVerify } from "../utils/jwtController";
import { ResponseObject } from "../utils/ResponseController";

const router = express.Router();

router.get("/", (_, res) => {
  console.log("in");
  res.json({ ok: "ok" });
});

// SECTION Register
router.post(
  "/register",
  // Input validation
  body("email").isEmail().withMessage("Email is not valid"),
  body("username")
    .isLength({ min: 5, max: undefined })
    .withMessage("Username must be at least 5 characters long"),
  body("password").isLength({ min: 8 }).isStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
    pointsPerUnique: 1,
    pointsPerRepeat: 0.5,
    pointsForContainingLower: 10,
    pointsForContainingUpper: 10,
    pointsForContainingNumber: 10,
    pointsForContainingSymbol: 10,
  }),
  async (req, res) => {
    const { email, username, password, firstname, lastname } = req.body;
    // Finds the validation errors in this request and wraps them in an object with handy functions
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // return res.status(400).json({ success: false, errors: errors.array() });
      return new ResponseObject(res, false, 400, "Input validation error", {
        error: errors.array(),
      }).send();
    }

    // ANCHOR Check If Email or Username Existed
    const users = await dbclient.user.findMany({
      where: {
        OR: [
          {
            email,
          },
          {
            profile: { username },
          },
        ],
      },
    });

    if (users.length > 0) {
      return res.json({
        success: false,
        error: {
          code: "",
          message: "Email or Username already in use",
        },
      });
    }

    // ANCHOR Start inserting data
    // hashing password
    const hashedPassword = await bcrypt.hash(password, BSalt);
    const newuser = await dbclient.user.create({
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
    return res.json({
      ok: true,
      data: {
        newuser,
      },
    });
  }
);
// !SECTION

// SECTION Login Route
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  //ANCHOR Check If Email Existed
  const user = await dbclient.user.findFirst({
    where: {
      profile: { username },
    },
    include: {
      profile: true,
    },
  });

  if (!user) {
    return res.json({
      ok: false,
      error: {
        message: "User not found!",
      },
    });
  }

  // ANCHOR 2 filter : Password validation
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res
      .status(400)
      .json({ success: false, message: "Username or password not correct" });
  }
  //ANCHOR Success sending JWT
  const accessToken = jwt.sign({ id: user.profile?.id }, accessTokenSecret!, {
    expiresIn: accessToken_Exp,
  });
  const refreshToken = jwt.sign({ id: user.profile?.id }, refreshTokenSecret!, {
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
      email: user.email,
    },
    data: {
      refreshToken: JSON.stringify(newRefreshToken),
    },
    include: {
      profile: true,
    },
  });
  return res.status(200).json({
    success: true,
    message: "Valid email & password.",
    accessToken: accessToken,
    refreshToken: refreshToken,
  });
});
// !SECTION

// ANCHOR Access token validation
router.post("/token/access", async (req, res) => {
  //check if the req.headers["authorization"] exist
  if (!req.headers["authorization"]) {
    return res.status(400).json({
      success: false,
      message: "Error : Missing Authorization Header provided!",
    });
  }

  const authHeader: string = req.headers["authorization"];
  // //getting authMethod and accessToken from the authHeader
  const authMethod: string = authHeader.split(" ")[0]; //authMethod == Bearer
  const accessToken: string = authHeader.split(" ")[1];

  //check is the authMethod & accessToken exist and the is method correct
  if (!authMethod || !accessToken) {
    return res
      .status(400)
      .json({ success: false, message: "Error : Invalid auth header!" });
  } else if (authMethod !== "Bearer") {
    return res
      .status(400)
      .json({ success: false, message: "Error : Invalid auth method!" });
  }
  const token = jwtVerify<AccessToken>(accessToken, accessTokenSecret);
  if (!token) {
    return res.json({
      success: false,
      error: {
        message: "Token is invalid",
      },
    });
  } else {
    return res.json({
      success: true,
      message: "Token is valid",
      token,
    });
  }
});

// SECTION Refresh token validation || Create new access token using refresh token
router.post("/token/refresh", async (req, res) => {
  //check if the req.headers["authorization"] exist
  if (!req.headers["authorization"]) {
    return res.status(400).json({
      success: false,
      message: "Error : Missing Authorization Header provided!",
    });
  }

  const authHeader: string = req.headers["authorization"];
  //getting authMethod and accessToken from the authHeader
  const authMethod: string = authHeader.split(" ")[0]; //authMethod == Bearer
  const refreshToken: string = authHeader.split(" ")[1];

  //check is the authMethod & accessToken exist and the is method correct
  if (!authMethod || !refreshToken) {
    return res
      .status(400)
      .json({ success: false, message: "Error : Invalid auth header!" });
  } else if (authMethod !== "Bearer") {
    return res
      .status(400)
      .json({ success: false, message: "Error : Invalid auth method!" });
  }

  //verify refreshToken
  const refreshTokenPayloads = jwtVerify<RefreshToken>(
    refreshToken,
    refreshTokenSecret
  );
  if (!refreshTokenPayloads) {
    return res.json({
      success: false,
      error: {
        message: "Refresh token invalid",
      },
    });
  }
  // const refreshTokenCheck = await userRepo.findOne({
  //   select: ["refreshToken"],
  //   where: { profile: { id: refreshTokenPayloads.id } },
  // });
  const refreshTokenCheck = await dbclient.user.findFirst({
    where: {
      profile: {
        id: refreshTokenPayloads.id,
      },
    },
  });
  //check if user exist
  if (!refreshTokenCheck) {
    return res
      .status(401)
      .json({ success: false, message: "Error : User not exist!" });
  }
  //check if the refresh token is in the database refresh token string array
  const refreshTokenList = JSON.parse(
    refreshTokenCheck.refreshToken || "[]"
  ) as string[];
  if (!refreshTokenList.includes(refreshToken)) {
    return res.status(401).json({
      success: false.valueOf,
      message: "Error : Token is not in the list!",
    });
  }
  //the refresh token is valid so create and return a new access token
  const userInfo = { id: refreshTokenPayloads.id };
  const newAccessToken = jwt.sign(userInfo, accessTokenSecret!, {
    expiresIn: accessToken_Exp,
  });
  return res.status(200).json({
    success: true,
    message: "Valid refresh token.",
    newAccessToken: newAccessToken,
  });
});
// !SECTION

// SECTION LogOut
router.post("/token/logout", async (req, res) => {
  //check if the req.headers["authorization"] exist
  if (!req.headers["authorization"]) {
    return res.status(400).json({
      success: false,
      message: "Error : Missing Authorization Header provided!",
    });
  }

  const authHeader: string = req.headers["authorization"];
  // //getting authMethod and accessToken from the authHeader
  const authMethod: string = authHeader.split(" ")[0]; //authMethod == Bearer
  const refreshToken: string = authHeader.split(" ")[1];

  //check is the authMethod & accessToken exist and the is method correct
  if (!authMethod || !refreshToken) {
    return res
      .status(400)
      .json({ success: false, message: "Error : Invalid auth header!" });
  } else if (authMethod !== "Bearer") {
    return res
      .status(400)
      .json({ success: false, message: "Error : Invalid auth method!" });
  }
  //get the refreshToken list from database by tokenPoayloads id
  const refreshTokenPayloads = jwtDecode<RefreshToken>(refreshToken);
  if (!refreshTokenPayloads) {
    return res.json({
      success: false,
      error: {
        message: "Refresh Token not valid",
      },
    });
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
    return res
      .status(400)
      .json({ success: false, message: "Error : User not exist!" });
  }
  //check is the token in the list or not
  let refreshTokenList = JSON.parse(user.refreshToken || "[]") as string[];
  //not in the list
  if (!refreshTokenList.includes(refreshToken)) {
    return res
      .status(400)
      .json({ success: false, message: "Error : Token is not in the list!" });
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
  return new ResponseObject(res, true, 200, "Refresh token removed.").send();
});
// !SECTION

export { router as authRouter };
