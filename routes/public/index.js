import express from "express";
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const router = express.Router();
const prisma = new PrismaClient()

// register route

router.post("/register", async(req, res) => {
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(req.body.password, salt)

    try {
        await prisma.user.create({
            data: {
                email: req.body.email,
                password: hashedPassword,
                name: req.body.name
            }
        })
    } catch (err) {
        console.log(err)
    }


    res.status(201).json(req.body)
})

// Login route

router.post("/login", async(req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                email: req.body.email,
            },
        })
    
        if(!user) {
            return res.status(401).json({message: "Invalid email or password"})
        }

        const validPassword = await bcrypt.compare(req.body.password, user.password)
        if(!validPassword) {
            return res.status(401).json({message: "Invalid email or password"})
        }
    } catch (err) {
        console.log(err)
    }
})

export default router;