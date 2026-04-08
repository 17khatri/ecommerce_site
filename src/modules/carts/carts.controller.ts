import { Response } from "express";
import * as cartService from "./carts.service.js";
import { AuthRequest } from "../../middleware/auth.middleware.js";
import { serializeBigInt } from "../../utils/serialize.js";
import { addToCartSchema } from "./cart.validation.js";
import { errorResponse, successResponse } from "../../utils/response.js";

export const craeteCartHandler = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        const validatedData = addToCartSchema.parse(req.body);

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const cart = await cartService.addToCart(userId, validatedData.productId, validatedData.variantId, validatedData.quantity);

        return successResponse(res, "Item added to cart successfully", serializeBigInt(cart), null, 201);

    } catch (error: any) {
        console.error(error);
        return errorResponse(res, "Failed to add item to cart", error.message || "Something went wrong", 500);
    }
};

export const getCartHandler = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const cart = await cartService.getCart(userId);

        return successResponse(res, "Cart retrieved successfully", serializeBigInt(cart));

    } catch (error: any) {
        return errorResponse(res, "Failed to retrieve cart", error.message || "Something went wrong", 500);
    }
};

export const updateCartItemHandler = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        const { productId, variantId, quantity } = req.body;

        // ✅ Basic validation
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (!productId || !variantId || quantity === undefined) {
            return res.status(400).json({
                message: "productId, variantId and quantity are required"
            });
        }

        if (quantity < 0) {
            return res.status(400).json({
                message: "Quantity cannot be negative"
            });
        }

        const result = await cartService.updateCartItem(
            userId,
            productId,
            variantId,
            quantity
        );

        return successResponse(res, "Cart item updated successfully", serializeBigInt(result));

    } catch (error: any) {
        return errorResponse(res, "Failed to update cart item", error.message || "Something went wrong", 500);
    }
};

export const deleteCartHandler = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        const { productId, variantId } = req.body

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" })
        }

        const deletedCartItem = await cartService.deleteCartItem(userId, productId, variantId)
        return successResponse(res, "Cart item removed successfully", serializeBigInt(deletedCartItem))
    } catch (error: any) {
        return errorResponse(res, "Failed to remove cart item", error.message || "Something went wrong", 500);
    }
}