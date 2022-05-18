import express from "express";
const router = express.Router();

router.get("/", (_, res) => {
  res.json("ok");
});

router.post("/", () => {});

export { router as authRouter };
