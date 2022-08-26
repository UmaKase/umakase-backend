import { PrismaClient } from "@prisma/client";
import express from "express";
import multerConfig from "../middleware/multerConfig";
import { tokenVerify } from "../middleware/token";
import { ResponseObject } from "../utils/ResponseController";
const router = express.Router();

const prisma = new PrismaClient();

/*
  Get Foods From *Big Database* With Name or Tags Name ( in Query)
  Query: name
  Query: tagName
*/
router.get("/db", async (req, res) => {
  const { name, tagName } = req.query;
  console.log({ name, tagName });
  const whereClause = name
    ? {
        name: {
          contains: name as string,
        },
      }
    : tagName
    ? {
        tags: {
          some: {
            tag: {
              name: { contains: tagName as string },
            },
          },
        },
      }
    : {};
  const foods = await prisma.food.findMany({
    where: whereClause,
  });

  return res.json({
    ok: true,
    foods,
  });
});

// _POST Upload Images and Tag
//  NOTE: This is a multipart/media request ("not json")
router.post(
  "/update",
  tokenVerify,
  multerConfig.single("image"),
  async (req, res) => {
    const { name, altName, country, tagIds } = req.body;

    // Check file and get filename for saving
    const file = req.file;
    if (!file) {
      return new ResponseObject(res, false, 400, "Please upload a file");
    }
    const img = file.filename;

    // TODO: Create tag if not have
    // createTags();

    const user = await prisma.profile.findFirst({
      where: {
        id: req.profile.id,
      },
    });

    if (!user) {
      return new ResponseObject(res, false, 400, "User not authenticated");
    }

    // Get Tags
    const tags = await prisma.tag.findMany({
      where: {
        OR: tagIds.map((id: string) => ({
          id,
        })),
      },
    });

    // Creating new food
    const newFood = await prisma.food.create({
      data: {
        name,
        altName: altName || "",
        country: country || "jp",
        img,
        tags: {
          createMany: {
            data: tags.map((tag) => ({
              tagId: tag.id,
            })),
          },
        },
      },
    });

    return new ResponseObject(res, true, 200, "Created", { newFood });
  }
);

export { router as foodRouter };
