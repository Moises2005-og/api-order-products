import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient()

router.get("/users", async(req, res) => {
    try {
        const users = await prisma.user.findMany({
            include: {
                products: true
            }
        })
        res.status(200).json(users)
    }catch (err) {
        console.log(err)
    }
})

// create product route

router.post("/product/:userId", async(req, res) => {
    try {
        const product = await prisma.product.create({
            data: {
                name: req.body.name,
                price: req.body.price,
                userId: req.params.userId
            }
        })
        res.status(201).json(product)   
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Error creating product" })
    }
})

// find one user

router.get("/user/:userId", async(req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: req.params.userId
            },
            include: {
                products: true
            }
        })
        res.status(200).json(user)
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Error fetching user" })
    }
})

// delete products route

router.delete("/product/:productId", async(req, res) => {
    try {
        const product = await prisma.product.delete({
            where: {
                id: req.params.productId
            }
        })
        res.status(200).json(product)
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Error deleting product" })
    }
})

// Delete user route

router.delete("/user/:userId", async(req, res) => {
    try {
        const user = await prisma.user.delete({
            where: {
                id: req.params.userId
            }
        })
        res.status(200).json(user)
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Error deleting user" })
    }
})

// Make order route

router.post("/order/:userId", async (req, res) => {
    try {
        if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
            return res.status(400).json({ message: "Items array is required" });
        }
        const order = await prisma.order.create({
            data: {
                userId: req.params.userId,
                items: {
                    create: req.body.items.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity
                    }))
                }
            },
            include: { items: true, product: true }
        });
        res.status(201).json(order);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error creating order" });
    }
});

// Get all orders route

router.get("/orders", async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            include: {
                items: true,
                user: true,
            }
        });
        res.status(200).json(orders);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error fetching orders" });
    }
})

export default router