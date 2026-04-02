import { Request, Response } from "express";
import { stripe } from "../../stripe/stripe.js";
import * as orderService from "../orders/order.service.js";

export const handleWebhook = async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"];

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig!,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }


    // ✅ PAYMENT SUCCESS
    if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object;

        const metadata = paymentIntent.metadata;

        await orderService.createOrderService({
            userId: metadata.userId,
            sessionId: paymentIntent.id,
            paymentStatus: "PAID", // 💳 paid
            fullName: metadata.fullName,
            city: metadata.city,
            zipCode: metadata.zipCode,
            state: metadata.state,
            address: metadata.address,
            paymentMethod: "STRIPE",
            items: JSON.parse(metadata.items)
        });
    }

    res.json({ received: true });
};