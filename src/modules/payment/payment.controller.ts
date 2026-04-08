import { Request, Response } from "express";
import { stripe } from "../../stripe/stripe.js";
import { AuthRequest } from "../../middleware/auth.middleware.js";
import * as orderService from "../orders/order.service.js";
import prisma from "../../prisma/client.js";

export const createCheckoutSession = async (req: AuthRequest, res: Response) => {
    try {
        const { items, fullName, city, state, zipCode, address, couponCode } = req.body;
        const parsedZipCode = Number(zipCode);
        const userId = req.user?.userId;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: "Items required" });
        }

        const formattedItems = items.map((item: any) => ({
            productId: item.productId,
            productVariantId: item.productVariantId, // ✅ FIX
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
            items: formattedItems,
            couponCode
        });

        // ✅ Step 1: Fetch variants from DB
        const variants = await prisma.productVariant.findMany({
            where: {
                id: {
                    in: items.map((i: any) => BigInt(i.productVariantId)),
                },
            },
            include: {
                product: true,
            },
        });

        // ✅ Step 2: Build line items
        const lineItems = items.map((item: any) => {
            const variant = variants.find(
                (v) => v.id.toString() === item.productVariantId.toString()
            );

            if (!variant) {
                throw new Error("Invalid product variant");
            }

            return {
                price_data: {
                    currency: "inr",
                    product_data: {
                        name: variant.product.name, // ✅ from DB
                    },
                    unit_amount: Number(order.finalAmount) * 100, // ✅ in paise
                },
                quantity: item.quantity,
            };
        });

        const productNames = items.map((item: any) => {
            const variant = variants.find(
                (v) => v.id.toString() === item.productVariantId.toString()
            );

            if (!variant) return "Unknown Item";

            return `${variant.product.name} (${variant.color}${variant.size ? " - " + variant.size : ""}) x${item.quantity}`;
        }).join(", ");


        // ✅ Step 3: Create Stripe session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",

            line_items: [
                {
                    price_data: {
                        currency: "inr",
                        product_data: {
                            name: productNames
                        },
                        unit_amount: Number(order.finalAmount) * 100,
                    },
                    quantity: 1, // ✅ IMPORTANT
                },
            ],

            metadata: {
                orderId: order.id.toString(),
            },

            success_url: "http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}",
            cancel_url: "http://localhost:3000/cancel",
        });

        await prisma.order.update({
            where: { id: order.id },
            data: {
                sessionId: session.id,
            },
        })


        return res.json({
            success: true,
            message: "Checkout session created",
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