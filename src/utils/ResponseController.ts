import { Response } from "express";

export class ResponseObject {
  private res: Response;
  private HTTPStatus: number;
  private messageOrError: string;
  private data: any;
  private status: boolean;
  constructor(
    res: Response,
    status: boolean,
    HTTPStatus: number | undefined,
    messageOrError: string,
    data?: any
  ) {
    this.res = res;
    this.status = status;
    this.HTTPStatus = HTTPStatus || 200;
    this.messageOrError = messageOrError;
    this.data = data;
  }

  send() {
    this.res.status(this.HTTPStatus || 200).json({
      ok: this.status,
      error: !this.status
        ? {
            message: this.messageOrError,
          }
        : undefined,
      message: this.status ? this.messageOrError : undefined,
      data: this.data,
    });
  }
}
