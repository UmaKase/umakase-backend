import { PrismaClient } from "@prisma/client";
import express from "express";
const router = express.Router();

interface query {
  [x: string]: string;
}

const prisma = new PrismaClient();

/*
  Get Foods From *Big Database* With Name or Tags Name ( in Query)
  Query: name
  Query: tagName
*/
router.get("/db", async (req, res) => {
  const { name, tagName }: query = req.body.query;

  const foods = await prisma.food.findMany({
    where: {
      OR: [
        {
          name: {
            contains: name,
          },
        },
        {
          altName: { contains: name },
        },
        {
          tags: {
            some: {
              tag: {
                name: { contains: tagName },
              },
            },
          },
        },
      ],
    },
  });

  return res.json({
    ok: true,
    foods,
  });
});

export { router as foodRouter };
