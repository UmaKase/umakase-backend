require("dotenv").config();
export const accessToken_Exp = "1d";
export const refreshToken_Exp = "30d";
export const accessTokenSecret =
  process.env.ACCESS_TOKEN_SECRET || "some super secret";
export const refreshTokenSecret =
  process.env.REFRESH_TOKEN_SECRET || "some other super  secret";
