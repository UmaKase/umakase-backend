import { PrismaClient } from "@prisma/client";
import express from "express";
import cors from "cors";

export const dbclient = new PrismaClient();

import { authRouter } from "./routes/auth";
import { userRouter } from "./routes/user";
import { foodRouter } from "./routes/food";
import { tagRouter } from "./routes/tag";

const PORT = process.env.PORT || 5000;

async function main() {
  const app = express();
  app.use(express.json());
  app.use(
    cors({
      origin: ["https://hoppscotch.io"],
    })
  );
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/user", userRouter);
  app.use("/api/v1/food", foodRouter);
  app.use("/api/v1/tag", tagRouter);

  app.get("/", (__, rs) => {
    rs.json({
      ok: "kkkk",
    });
  });

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
