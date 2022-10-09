import HttpStatusCode from "@utils/httpStatus";
import { Response } from "express";

/**
 * Return Same Response Object everytime
 * @param res Express's Response Object
 * @param HTTPStatus - yes It's Http status
 * @param messageOrError - Message or error
 * @param data - any date
 */
export const Responser = (
  res: Response,
  HTTPStatus: HttpStatusCode = 200,
  messageOrError: string = "Success",
  data?: any
) => {
  const isOk = [100, 200].includes(HTTPStatus);
  res.status(HTTPStatus).json({
    ok: isOk ? true : false,
    error: isOk
      ? {
          message: messageOrError,
        }
      : undefined,
    message: messageOrError,
    data,
  });
};
