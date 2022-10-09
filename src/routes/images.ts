import express from "express";
import { Responser } from "@utils/ResponseController";
import path from "path";
import fs from "fs";
import HttpStatusCode from "@utils/httpStatus";

const router = express.Router();

/*
 ************************************
 * _API /api/v1/img                *
 ************************************
 */

router.get("/food/:name", async (req, res) => {
  const imageName = req.params.name;
  if (!imageName) {
    return Responser(res, HttpStatusCode.NOT_FOUND, "Please provide images id");
  }

  const imgPath = path.join(
    __dirname,
    "..",
    "..",
    "storage",
    "foods",
    imageName
  );

  if (!fs.existsSync(imgPath)) {
    return Responser(
      res,
      HttpStatusCode.NOT_FOUND,
      "Can't find image with provided name"
    );
  }
  return res.sendFile(imgPath);
});

export { router as imagesRouter };
