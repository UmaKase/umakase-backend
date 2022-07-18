import { Response } from "express";

/**
*  Response class. Use this to have right response syntax

*  @param res
*  @param status
*  @param HTTPStatus
*  @param messageOrError 
*  @param data 

  Example: 

  ```typescript
  router.get('/', (req, res) => {
    return new ResponseObject(res, true, 200, "success", { hello: "world" })
  })
  ```
 */
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
    this.send();
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
