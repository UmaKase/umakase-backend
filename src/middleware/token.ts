import { ResponseObject } from "@utils/ResponseController";
import { Request, Response, NextFunction } from "express";
import { accessTokenSecret } from "../config/config";
import { jwtVerify } from "../utils/jwtController";

export const tokenVerify = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  //check if the req.headers["authorization"] exist
  if (!req.headers["authorization"]) {
    return new ResponseObject(
      res,
      false,
      401,
      "Error : Missing Authorization Header provided!"
    );
  }

  const authHeader: string = req.headers.authorization;
  //getting authMethod and accessToken from the authHeader
  const authMethod: string = authHeader.split(" ")[0];
  const accessToken: string = authHeader.split(" ")[1];

  //check is the authMethod & accessToken exist and the is method correct
  if (!authMethod || !accessToken) {
    return new ResponseObject(res, false, 401, "Error : Auth Token Not Found!");
  }
  if (authMethod !== "Bearer") {
    return new ResponseObject(res, false, 401, "Error : Invalid auth method!");
  }

  const claims = jwtVerify<AccessToken>(accessToken, accessTokenSecret);

  if (!claims) {
    return new ResponseObject(res, false, 401, "Error : Invalid token!");
  }
  req.profile = claims;
  return next();
};
