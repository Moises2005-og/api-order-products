import express from "express";
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const router = express.Router();
const prisma = new PrismaClient()
const jwtCode = process.env.JWT_SECRET

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
            return res.status(401).json({message: "Usuário não encontrado"})
        }

        const validPassword = await bcrypt.compare(req.body.password, user.password)

        if(!validPassword) {
            return res.status(400).json({message: "palavra passe invalida"})
        }

        const token = jwt.sign({id: user.id}, jwtCode, {expiresIn: "1h"})

        res.status(200).json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                token: token
            },
        })
    } catch (err) {
        console.log(err)
    }
})

export default router;