import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

export interface Food {
  id: string;
  name: string;
  altName: string;
  country: string;
  img: null;
  tags: TagOnFood[];
}

interface TagOnFood {
  tagId: string;
  foodId: string;
}

export interface Tag {
  id: string;
  name: string;
}

const prisma = new PrismaClient();

let foods: Food[] = [];
let tags: Tag[] = [];

fs.readFile(
  path.join(__dirname, "..", "..", "prisma", "seed", "food.json"),
  "utf8",
  (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    try {
      foods = JSON.parse(data.toString());
    } catch (error) {
      throw console.log(error);
    }
  }
);

fs.readFile(
  path.join(__dirname, "..", "..", "prisma", "seed", "tags.json"),
  "utf8",
  (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    try {
      tags = JSON.parse(data.toString());
    } catch (error) {
      throw console.log(error);
    }
  }
);

const addDataToDB = async () => {
  // Clear Tables
  const tagDeleted = await prisma.tag.deleteMany();
  const foodDeleted = await prisma.food.deleteMany();

  console.log({
    tag: tagDeleted.count,
    food: foodDeleted.count,
  });

  const created = await prisma.tag.createMany({
    data: tags.map((tag) => {
      return {
        id: tag.id,
        name: tag.name,
      };
    }),
  });
  console.log(`Created: ${created.count} tags`);
  await addFoodsToDB(foods);
  console.log("END");
};

const addFoodsToDB = async (foods: Food[]) => {
  let bool = false;
  await Promise.all(
    foods.map((food) => {
      const foodOnTags = food.tags.map((tag) => ({
        tag: {
          connect: {
            id: tag.tagId,
          },
        },
      }));
      if (!bool) {
        bool = !bool;
        console.log(foodOnTags);
      }
      return prisma.food.create({
        data: {
          id: food.id,
          altName: food.altName,
          name: food.name,
          country: food.country,
          img: food.img,
          tags: {
            create: foodOnTags,
          },
        },
      });
    })
  ).then(() => {
    console.log("added foods");
  });
};

addDataToDB();
