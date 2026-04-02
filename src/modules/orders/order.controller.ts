import { Request, Response } from "express";
import * as orderService from "./order.service.js";
import { AuthRequest } from "../../middleware/auth.middleware.js";
import prisma from "../../prisma/client.js";
import { serializeBigInt } from "../../utils/serialize.js";
import { ZodError } from "zod";
import { createOrderSchema } from "./order.validation.js";

export const createOrderHandler = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        // ✅ Validate request
        const validatedData = createOrderSchema.parse(req.body);

        const formattedItems = validatedData.items.map((item) => ({
            productId: item.productId,
            productVariantId: item.variantId,
            quantity: item.quantity
        }));

        const order = await orderService.createOrderService({
            userId,
            sessionId: validatedData.sessionId,
            paymentStatus: "PENDING",
            fullName: validatedData.fullName,
            city: validatedData.city,
            zipCode: validatedData.zipCode,
            state: validatedData.state,
            address: validatedData.address,
            paymentMethod: validatedData.paymentMethod,
            items: formattedItems
        });

        if (validatedData.paymentMethod === "COD") {
            await clearCartAfterOrder(userId, formattedItems);
        }

        return res.status(201).json({
            message: "Order placed successfully",
            data: serializeBigInt(order)
        });

    } catch (error: any) {

        if (error instanceof ZodError) {
            return res.status(400).json({
                error: error.issues.map((e) => ({
                    field: e.path.join("."),
                    message: e.message
                }))
            });
        }

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const clearCartAfterOrder = async (userId: string, items: any[]) => {
    const cart = await prisma.cart.findUnique({
        where: { userId: BigInt(userId) },
    });

    if (!cart) return;

    await prisma.cartItem.deleteMany({
        where: {
            cartId: cart.id,
            variantId: {
                in: items.map(i => BigInt(i.productVariantId)),
            },
        },
    });
};