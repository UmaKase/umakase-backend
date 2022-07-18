import { PrismaClient } from "@prisma/client";
import express from "express";
import { ResponseObject } from "../utils/ResponseController";
const router = express.Router();

const prisma = new PrismaClient();

/*
  _GET Get Tags
  Query: limit : number
  Query: page : number
*/
router.get("/", async (req, res) => {
  const take: number = Number(req.query.take) || 10;
  // -- Page actually start from 0, but in pagination its start from 1
  const page: number = take * (Number(req.query.page) - 1 || 0);

  const tags = await prisma.tag.findMany({
    take,
    skip: page,
    include: {
      food: {
        include: {
          food: true,
        },
      },
    },
  });

  return new ResponseObject(res, true, 200, "Successfully", { tags });
});

export { router as tagRouter };
