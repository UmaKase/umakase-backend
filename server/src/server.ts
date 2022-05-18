import { PrismaClient } from "@prisma/client";
import express from "express";
import cors from "cors";

export const dbclient = new PrismaClient();

import { authRouter } from "./routes/auth";
import { userRouter } from "./routes/user";

const PORT = process.env.PORT || 5000;

async function main() {
  const app = express();
  app.use(cors());
  app.use("/ap1/v1/auth", authRouter);
  app.use("/ap1/v1/user", userRouter);

  app.listen(PORT, () => {
    console.log("running on port ", PORT);
  });
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await dbclient.$disconnect();
  });
