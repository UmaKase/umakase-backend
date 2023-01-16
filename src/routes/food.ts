import { tokenVerify } from "@middleware/token";
import { Food, PrismaClient, Profile, Tag, TagsOnFoods } from "@prisma/client";
import { Responser } from "@utils/ResponseController";
import express from "express";
import multerConfig from "@middleware/multerConfig";
import HttpStatusCode from "@utils/httpStatus";
import { DEFAULT_RANDOM_COUNT } from "@config/config";
import { randomMultiple } from "@utils/_";
const router = express.Router();

/*
 ************************************
 * _API /api/v1/food                *
 ************************************
 */

const prisma = new PrismaClient({ log: [] });

/**
 * _GET Default Room's default's food
 */
router.get("/default", tokenVerify, async (req, res) => {
  const profileId = req.profile.id;

  type ProfileWithCreatedRoom =
    | (Profile & {
        createdRooms: {
          foods: {
            food: Food & {
              tags: {
                tag: Tag;
              }[];
            };
            isFavorite: boolean;
          }[];
        }[];
      })
    | null;

  const profile: ProfileWithCreatedRoom = await prisma.profile.findFirst({
    where: {
      id: profileId,
    },
    include: {
      createdRooms: {
        take: 1,
        orderBy: {
          createdAt: "asc",
        },
        select: {
          foods: {
            select: {
              food: {
                include: {
                  tags: {
                    select: {
                      tag: true,
                    },
                  },
                },
              },
              isFavorite: true,
            },
          },
        },
      },
    },
  });

  if (!profile) {
    return Responser(res, HttpStatusCode.BAD_REQUEST, "Cannot find user");
  }

  const tags = profile.createdRooms[0].foods.map((food) => {
    return food.food.tags.map((tag) => tag.tag.name);
  });

  if (profile.createdRooms.length === 0) {
    return Responser(
      res,
      HttpStatusCode.BAD_REQUEST,
      "No default room. Contact developer to fix"
    );
  }

  return Responser(res, HttpStatusCode.OK, "Success. Food returns in response", {
    foods: profile.createdRooms[0].foods,
    tags: [...new Set(tags.flatMap((tagName) => tagName))],
  });
});

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

/**
 * _POST Create new food
 * TODO: This will create new food in the food table. create other one instead.
 * NOTE: This is a multipart/media request ("not json")
 *
 */
router.post("/add", tokenVerify, multerConfig.single("image"), async (req, res) => {
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
    return Responser(res, HttpStatusCode.UNAUTHORIZED, "User not authenticated");
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
});

/**
 * _GET Random food on room
 * @Query number count
 * @Body  string roomId
 */
router.get("/random/:roomId", tokenVerify, async (req, res) => {
  let count = Number(req.query.count) || DEFAULT_RANDOM_COUNT;

  const profile = await prisma.profile.findFirst({
    where: { id: req.profile.id },
  });

  // Validate user
  if (!profile) {
    return Responser(res, HttpStatusCode.UNAUTHORIZED, "Unauthorized or profile invalid");
  }

  // Validate room and also get food
  const room = await prisma.room.findFirst({
    where: {
      id: req.params.roomId,
    },
    include: {
      foods: {
        include: {
          food: true,
        },
      },
    },
  });

  if (!room) {
    return Responser(res, HttpStatusCode.BAD_REQUEST, "Can't find room");
  }

  // take food and randomizing
  const foods = room.foods.map((food) => {
    return food.food;
  });

  if (foods.length < count) {
    count = foods.length;
  }
  const randomIndex = randomMultiple(0, foods.length, count);

  const randomizedFoods = randomIndex.map((index) => foods[index]);

  return Responser(res, HttpStatusCode.OK, "Food randomized", {
    randomFoods: randomizedFoods,
    randomIndex,
  });
});

/**
 * _POST Toggle isFavoriteFood
 * @param string foodId
 */
router.post("/favorite", tokenVerify, async (req, res) => {
  // Check Profile
  const profile = await prisma.profile.findFirst({
    where: {
      id: req.profile.id,
    },
    include: {
      rooms: {
        select: {
          room: {
            include: { foods: true },
          },
        },
        take: 1,
        orderBy: {
          joinedAt: "asc",
        },
      },
    },
  });
  if (!profile) {
    return Responser(
      res,
      HttpStatusCode.BAD_REQUEST,
      "Can't not find user with provided auth"
    );
  }

  if (profile.rooms.length <= 0) {
    return Responser(
      res,
      HttpStatusCode.BAD_REQUEST,
      "Cannot find default room. Contact developer for more infomation"
    );
  }
  // Check if the food is in room
  const foodInRoom = profile.rooms[0].room.foods.find(
    (food) => food.foodId === req.body.foodId
  );
  if (!foodInRoom) {
    return Responser(
      res,
      HttpStatusCode.BAD_REQUEST,
      "You do not have that food in your library"
    );
  }

  // Found food. Toggle favorite food
  try {
    const result = await prisma.foodsOnRooms.update({
      where: {
        roomId_foodId: {
          foodId: foodInRoom.foodId,
          roomId: foodInRoom.roomId,
        },
      },
      data: {
        isFavorite: !foodInRoom.isFavorite,
      },
    });
    console.log(result);
  } catch (error) {
    return Responser(res, HttpStatusCode.BAD_REQUEST, "Unexpected Error.");
  }

  return Responser(res, HttpStatusCode.OK, "Updated");
});

export { router as foodRouter };
