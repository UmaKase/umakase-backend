import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

export interface Food {
  id: string;
  name: string;
  altName: string;
  country: string;
  img: null;
  tags: Tag[];
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

const addTagsToDB = async (tags: Tag[]) => {
  const created = await prisma.tag.createMany({
    data: tags.map((tag) => {
      return {
        id: tag.id,
        name: tag.name,
      };
    }),
  });
  console.log(`Created: ${created.count} tags`);
};
