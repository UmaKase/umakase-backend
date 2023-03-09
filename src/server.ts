import { PrismaClient } from "@prisma/client";
import express from "express";
import "module-alias/register";

// Middware
import cors from "cors";
import { routeLogger } from "./middleware/routeLogger";

// Routes
import { authRouter } from "./routes/auth";
import { userRouter } from "./routes/user";
import { foodRouter } from "./routes/food";
import { tagRouter } from "./routes/tag";
import { imagesRouter } from "./routes/images";
import { Log } from "./utils/Log";
import { roomRouter } from "./routes/room";
import { attachGlobalFunction } from "@utils/_";
import { testRouter } from "./routes/test";

export const logg = new Log(process.env.LOG_PATH);
export const dbclient = new PrismaClient();

const PORT = process.env.PORT || 5000;

async function main() {
  const app = express();
  app.use(express.json());
  app.use(
    cors({
      origin: ["https://hoppscotch.io"],
    })
  );
  app.use(routeLogger);

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/user", userRouter);
  app.use("/api/v1/food", foodRouter);
  app.use("/api/v1/tag", tagRouter);
  app.use("/api/v1/img", imagesRouter);
  app.use("/api/v1/room", roomRouter);
  if (process.env.NODE_ENV !== "production") {
    app.use("/api/v1/test", testRouter);
  }

  app.get("/", (__, rs) => {
    rs.json({
      ok: "kkkk",
    });
  });

  app.listen(PORT, () => {
    console.log("running on port ", PORT);
  });
}

attachGlobalFunction();

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await dbclient.$disconnect();
  });
