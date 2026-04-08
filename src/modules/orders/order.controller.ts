import { Response } from "express";
import * as orderService from "./order.service.js";
import { AuthRequest } from "../../middleware/auth.middleware.js";
import { serializeBigInt } from "../../utils/serialize.js";
import { ZodError } from "zod";
import { createOrderSchema } from "./order.validation.js";
import { errorResponse, successResponse } from "../../utils/response.js";

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
            productVariantId: item.productVariantId,
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
            items: formattedItems,
            couponCode: validatedData.couponCode
        });

        return successResponse(res, "Order created successfully", serializeBigInt(order), null, 201)

    } catch (error: any) {

        if (error instanceof ZodError) {
            return res.status(400).json({
                error: error.issues.map((e) => ({
                    field: e.path.join("."),
                    message: e.message
                }))
            });
        }

        return errorResponse(res, "Failed to create order", error.message || "Something went wrong", 400);
    }
};


export const getUserOrdersHandler = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const orders = await orderService.getUserOrdersService(userId);
        return successResponse(res, "Orders retrieved successfully", serializeBigInt(orders), null, 200);
    } catch (error: any) {
        return errorResponse(res, "Failed to retrieve orders", error.message || "Something went wrong", 400);
    }
};