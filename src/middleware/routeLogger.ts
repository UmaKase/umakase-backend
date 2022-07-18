import { NextFunction, Request, Response } from "express";
import logger from "node-color-log";

export const routeLogger = (req: Request, _: Response, next: NextFunction) => {
  logger.bgColor("white").color("black").log(req.method);
  logger.bgColor("white").color("red").log(req.url);
  next();
};
