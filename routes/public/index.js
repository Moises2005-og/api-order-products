import express from "express";
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import crypto from "crypto";
import nodemailer from "nodemailer";

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

        const token = jwt.sign({id: user.id}, jwtCode, {expiresIn: "7d"})

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

// Função utilitária para enviar e-mail
async function sendEmail(to, subject, text) {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false, // true para 465, false para outros
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
    await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        text,
    });
}

// otp route

router.post("/auth/request-reset", async (req, res) => {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otpCode = String(Math.floor(100000 + Math.random() * 900000)); // 6 dígitos
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    await prisma.user.update({
        where: { email },
        data: { otpCode, otpExpiresAt }
    });

    try {
        await sendEmail(
            user.email,
            "Seu código de recuperação de senha",
            `Seu código OTP para recuperação de senha é: ${otpCode}\nVálido por 10 minutos.`
        );
        res.json({ message: "OTP enviado para o e-mail cadastrado." });
    } catch (err) {
        console.log("Erro ao enviar e-mail:", err);
        res.status(500).json({ message: "Erro ao enviar o e-mail com o OTP. Tente novamente mais tarde." });
    }
});

router.post("/auth/reset-password", async (req, res) => {
    const { email, otpCode, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.otpCode !== otpCode || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
        return res.status(400).json({ message: "OTP inválido ou expirado." });
    }

    // Hash da nova senha antes de salvar
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
        where: { email },
        data: {
            password: hashedPassword,
            otpCode: null,
            otpExpiresAt: null
        }
    });

    res.json({ message: "Senha alterada com sucesso." });
});

export default router;