import { Request, Response } from "express";
import { stripe } from "../../stripe/stripe.js";
import { AuthRequest } from "../../middleware/auth.middleware.js";
import * as orderService from "../orders/order.service.js";
import prisma from "../../prisma/client.js";

export const createCheckoutSession = async (req: AuthRequest, res: Response) => {
    try {
        const { items, fullName, city, state, zipCode, address } = req.body;
        const parsedZipCode = Number(zipCode);
        const userId = req.user?.userId;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: "Items required" });
        }

        const formattedItems = items.map((item: any) => ({
            productId: item.productId,
            productVariantId: item.variantId, // ✅ FIX
            quantity: item.quantity
        }));

        const order = await orderService.createOrderService({
            userId,
            paymentStatus: "PENDING",
            paymentMethod: "STRIPE",
            fullName,
            city,
            zipCode: parsedZipCode,
            state,
            address,
            items: formattedItems
        });

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",

            line_items: items.map((item: any) => ({
                price_data: {
                    currency: "inr",
                    product_data: {
                        name: item.product.name,
                    },
                    unit_amount: item.price * 100,
                },
                quantity: item.quantity,
            })),

            metadata: {
                orderId: order.id.toString(),
            },

            success_url: "http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}",
            cancel_url: "http://localhost:3000/cancel",
        });

        console.log("Stripe session created:", session);

        return res.json({
            url: session.url,
        });

    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
};

export const getSessionDetails = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.query;

        if (typeof sessionId !== "string") {
            return res.status(400).json({ message: "Invalid sessionId" });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        const orderId = session.metadata?.orderId;

        if (!orderId) {
            return res.status(400).json({ message: "Order not found in metadata" });
        }

        // ✅ PAYMENT SUCCESS
        if (session.payment_status === "paid") {

            await prisma.order.update({
                where: { id: BigInt(orderId) },
                data: {
                    paymentStatus: "SUCCESS",
                },
            });

            // ✅ CLEAR CART NOW
            await clearCart(orderId);
        }

        // ❌ PAYMENT FAILED
        if (session.payment_status !== "paid") {
            await prisma.order.update({
                where: { id: BigInt(orderId) },
                data: {
                    paymentStatus: "FAILED",
                },
            });
        }

        return res.json({
            sessionId: session.id,
            paymentStatus: session.payment_status,
            orderId
        });

    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};

const clearCart = async (orderId: string) => {
    const orderItems = await prisma.orderItem.findMany({
        where: { orderId: BigInt(orderId) },
    });

    const order = await prisma.order.findUnique({
        where: { id: BigInt(orderId) },
    });

    if (!order) return;

    const cart = await prisma.cart.findUnique({
        where: { userId: order.userId },
    });

    if (!cart) return;

    await prisma.cartItem.deleteMany({
        where: {
            cartId: cart.id,
            variantId: {
                in: orderItems.map(i => i.productVariantId),
            },
        },
    });
};