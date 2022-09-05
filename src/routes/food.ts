/*
 ************************************
 * _API /api/v1/food                *
 ************************************
 */
import { Food, PrismaClient, TagsOnFoods } from "@prisma/client";
import express from "express";
import multerConfig from "../middleware/multerConfig";
import { tokenVerify } from "../middleware/token";
import { ResponseObject } from "../utils/ResponseController";
const router = express.Router();

const prisma = new PrismaClient({});

/**
  _GET Foods From *Big Database* With Name or Tags Name ( in Query)
* NOTE: This route don't need token to get
* @Query string[] name
* @Query string[] tagIds 
* @Query string[] excludeTagIds - Food Ids
* @Query string[] tagName
* @Query number take 
* @Query number page
*/
router.get("/db", async (req, res) => {
  const { name, tagName } = req.query;
  const take: number = Number(req.query.take) || 10;
  // -- Page actually start from 0, but in pagination its start from 1
  const page: number = take * (Number(req.query.page) - 1 || 0);

  const tagIds: string[] = (
    req.query.tagIds
      ? typeof req.query.tagIds === "string"
        ? [req.query.tagIds]
        : req.query.tagIds
      : []
  ) as string[];
  const excludeTags: string[] = (
    req.query.excludeTagIds
      ? typeof req.query.excludeTagIds === "string"
        ? [req.query.excludeTagIds]
        : req.query.excludeTagIds
      : []
  ) as string[];
  const excludeFoods: string[] = (
    req.query.excludeFoodIds
      ? typeof req.query.excludeFoodIds === "string"
        ? [req.query.excludeFoodIds]
        : req.query.excludeFoodIds
      : []
  ) as string[];

  const whereClause = name
    ? {
        name: {
          contains: name as string,
        },
      }
    : {
        tags: {
          some: {
            OR: [
              tagName
                ? {
                    tag: {
                      name: { contains: tagName as string },
                    },
                  }
                : {},
              {
                tag: {
                  id: {
                    in: tagIds,
                  },
                },
              },
            ],
          },
          every: {
            tag: {
              id: {
                notIn: excludeTags,
              },
            },
          },
        },
      };

  const foods: (Food & { tags: TagsOnFoods[] })[] = await prisma.food.findMany({
    where: { ...whereClause, id: { notIn: excludeFoods } },
    include: {
      tags: true,
    },
    take,
    skip: page,
  });

  return res.json({
    ok: true,
    foods,
  });
});

// _POST Upload Images and Tag
//  NOTE: This is a multipart/media request ("not json")
router.post(
  "/add",
  tokenVerify,
  multerConfig.single("image"),
  async (req, res) => {
    const { name, altName, country } = req.body;
    const tagIds = req.body.tagIds || [];

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
