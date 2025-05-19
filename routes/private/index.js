import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient()

router.get("/users", async(req, res) => {
    try {
        const users = await prisma.user.findMany()
        res.status(200).json(users)
    }catch (err) {
        console.log(err)
    }
})

export default router