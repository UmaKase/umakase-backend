import { PrismaClient } from "@prisma/client";
import { v4 } from "uuid";
import { generateName } from "./generateRandomName";
import bcrypt from "bcrypt";
import { BSalt } from "../config/config";

const prisma = new PrismaClient();

export const createTempUser = async () => {
  const tmpId = v4();
  // to bypass database validation
  const tmpPass = generateName();
  // hashing password
  const hashedPassword = await bcrypt.hash(tmpPass, BSalt);
  await prisma.user.create({
    data: {
      password: hashedPassword,
      tmpId,
      profile: {
        create: {
          username: tmpId,
        },
      },
    },
  });

  return {
    tmpId,
    tmpPass,
  };
};
