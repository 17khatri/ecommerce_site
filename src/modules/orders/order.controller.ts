import { Request, Response } from "express";
import * as orderService from "./order.service.js";
import { AuthRequest } from "../../middleware/auth.middleware.js";

export const createOrderHandler = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    try {
        const {
            sessionId,
            totalAmount,
            paymentStatus,
            fullName,
            city,
            zipCode,
            state,
            address,
            paymentMethod,
            items
        } = req.body;

        // ✅ Validation (same pattern as your product controller)
        if (
            !paymentStatus ||
            !fullName ||
            !city ||
            !zipCode ||
            !state ||
            !address ||
            !paymentMethod ||
            !items?.length
        ) {
            return res.status(400).json({
                success: false,
                message: "All required fields and items are required"
            });
        }

        // ✅ Call service
        const order = await orderService.createOrderService({
            userId,
            sessionId,
            paymentStatus,
            fullName,
            city,
            zipCode,
            state,
            address,
            paymentMethod,
            items
        });

        // ✅ Serialize BigInt (same as your code)
        const serialized = JSON.parse(
            JSON.stringify(order, (_, value) =>
                typeof value === "bigint" ? value.toString() : value
            )
        );

        return res.status(201).json({
            message: "Order created successfully",
            data: serialized
        });

    } catch (error: any) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};