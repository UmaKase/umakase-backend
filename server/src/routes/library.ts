import { PrismaClient } from "@prisma/client";
import express from "express";
const router = express.Router();

const prisma = new PrismaClient();

router.get("/", async (req, res) => {});

export { router as libraryRouter };
