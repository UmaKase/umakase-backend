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
      return res.status(400).json({ success: false, errors: errors.array() });
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

export { router as authRouter };
