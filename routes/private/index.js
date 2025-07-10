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
        if (!req.body.name || !req.body.price) {
            return res.status(400).json({ message: "Name and price are required" });
        }
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

// get all products by user route

router.get("/products/:userId", async(req, res) => {
    try {
        const products = await prisma.product.findMany({
            where: {
                userId: req.params.userId
            }
        })
        res.status(200).json(products)
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Error fetching products" })
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

router.delete("/order/:orderId", async (req, res) => {
    try {
        await prisma.orderItem.deleteMany({
            where: { orderId: req.params.orderId }
        });

        const order = await prisma.order.delete({
            where: { id: req.params.orderId }
        });

        res.status(200).json(order);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error deleting order" });
    }
});

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

        const productIds = req.body.items.map(item => item.productId);
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } }
        });

        const total = req.body.items.reduce((sum, item) => {
            const product = products.find(p => p.id === item.productId);
            return sum + ((product?.price || 0) * item.quantity);
        }, 0);

        const profitMargin = Number(req.body.profitMargin) || 0;
        const workCost = Number(req.body.workCost) || 0;
        const costWithWork = total + workCost;
        const suggestedPrice = costWithWork + (costWithWork * (profitMargin / 100));

        const order = await prisma.order.create({
            data: {
                userId: req.params.userId,
                total: costWithWork,
                profitMargin,
                workCost,
                suggestedPrice,
                status: "pending",
                items: {
                    create: req.body.items.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity
                    }))
                }
            },
            include: { 
                items: { include: { product: true } },
                user: true
            }
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
                items: { include: { product: true } },
                user: true,
            }
        });
        res.status(200).json(orders);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error fetching orders" });
    }
})

// orders by user route

router.get("/orders/me/:userId", async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            where: {
                userId: req.params.userId
            },
            include: {
                items: { include: { product: true } },
                user: true,
            }
        });
        res.status(200).json(orders);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error fetching orders" });
    }
})

// put order route

router.put("/order/:orderId/finished", async (req, res) => {
    try {
        const order = await prisma.order.update({
            where: {
                id: req.params.orderId
            },
            data: {
                status: "finished"
            }
        });
        res.status(200).json(order);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error updating order" });
    }
})

// create a goal

router.post("/goal/:userId", async(req, res) =>  {
    const now = new Date().toISOString();

    try {
        const response = await prisma.goal.create({
            data: {
                userId: req.params.userId,
                title: req.body.title,
                startdDate: now,
                endDate: req.body.endDate,
                targetAmount: req.body.targetAmount
            }
        })

        res.status(201).json(response)

    } catch (error){
        console.log(error)
        res.status(501).json({message: "Internal Server Error"})
    } finally {
        console.log("")
    }
})

// get all goals by user

router.get("/goals/me/:userId", async(req, res) => {
    try {
        const goals = await prisma.goal.findMany({
            where: {
                userId: req.params.userId
            }
        })

        res.status(200).json(goals);
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Error fetching goals" });
    }
})

// delete order route

router.delete("/order/:orderId", async (req, res) => {
    try {
        const order = await prisma.order.delete({
            where: {
                id: req.params.orderId
            }
        });
        res.status(200).json(order);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error deleting order" });
    }
})

export default router