import express from "express";
import { ResponseObject } from "@utils/ResponseController";
import path from "path";
import fs from "fs";

const router = express.Router();

/*
 ************************************
 * _API /api/v1/img                *
 ************************************
 */

router.get("/food/:name", async (req, res) => {
  const imageName = req.params.name;
  if (!imageName) {
    return new ResponseObject(res, false, 404, "Please provide images id");
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
    return new ResponseObject(
      res,
      false,
      404,
      "Can't find image with provided name"
    );
  }
  return res.sendFile(imgPath);
});

export { router as imagesRouter };
