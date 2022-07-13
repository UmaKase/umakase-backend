import { PrismaClient } from "@prisma/client";
import express from "express";
const router = express.Router();

const prisma = new PrismaClient();

/*
  Get Foods From *Big Database* With Name or Tags Name ( in Query)
  Query: name
  Query: tagName
*/
router.get("/db", async (req, res) => {
  const { name, tagName } = req.query;

  const foods = await prisma.food.findMany({
    where: {
      OR: [
        {
          name: {
            contains: name as string,
          },
        },
        {
          altName: { contains: name as string },
        },
        {
          tags: {
            some: {
              tag: {
                name: { contains: tagName as string },
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