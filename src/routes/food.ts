import { tokenVerify } from "@middleware/token";
import { Food, PrismaClient, TagsOnFoods } from "@prisma/client";
import { Responser } from "@utils/ResponseController";
import express from "express";
import multerConfig from "@middleware/multerConfig";
import HttpStatusCode from "@utils/httpStatus";
const router = express.Router();

/*
 ************************************
 * _API /api/v1/food                *
 ************************************
 */

const prisma = new PrismaClient({});

/**
  _POST Get Foods From *Big Database* With Name or Tags Name ( in Query)
* NOTE: This route don't need token to get
* @Query string[] name
* @Query string[] tagName
* @Query number take 
* @Query number page
* @Body string[] tagIds 
* @Body string[] excludeTags - Tag Ids
* @Body string[] excludeFoods - Food Ids
*/
router.post("/db", async (req, res) => {
  const { name, tagName } = req.query;
  const take: number = Number(req.query.take) || 10;
  // -- Page actually start from 0, but in pagination its start from 1
  const page: number = take * (Number(req.query.page) - 1 || 0);

  const tagIds = req.body.tagIds || [];
  const excludeTags = req.body.excludeTagIds || [];
  const excludeFoods = req.body.excludeFoods || [];

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

  return Responser(res, HttpStatusCode.OK, "Foods contain in response", {
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
      return Responser(res, HttpStatusCode.BAD_REQUEST, "Please upload a file");
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
      return Responser(
        res,
        HttpStatusCode.UNAUTHORIZED,
        "User not authenticated"
      );
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

    return Responser(res, HttpStatusCode.OK, "Created", { newFood });
  }
);

export { router as foodRouter };
