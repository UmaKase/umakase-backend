import express from "express";
import { dbclient } from "../server";
const router = express.Router();

interface query {
  [x: string]: string;
}

router.get("/", async (req, res) => {
  const { name, tagName }: query = req.body.query;

  const foods = await dbclient.food.findMany({
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
