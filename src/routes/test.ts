import { PrismaClient } from "@prisma/client";
import { Responser } from "@utils/ResponseController";
import HttpStatusCode from "@utils/httpStatus";
import express, { Request, Response } from "express";
const router = express.Router();

const prisma = new PrismaClient();

const fallback = (res: Response) => Responser(res, HttpStatusCode.INTERNAL_SERVER_ERROR, "Internal Server Error");

// SECTION handlers
const getTest = async (_req: Request, _res: Response) => {
    throw new Error("Test");
};

const deleteUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    await prisma.user.delete({
        where: {
            id,
        },
    });
    return Responser(res, HttpStatusCode.OK, "Deleted");
};
// !SECTION

// SECTION routes
router.get("/", (req, res) => unwrap(getTest(req, res), fallback(res)));
router.get("/delete/:id", (req, res) => unwrap(deleteUser(req, res), () => fallback(res)));
// !SECTION

export { router as testRouter };
