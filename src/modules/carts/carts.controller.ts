import { Response } from "express";
import * as cartService from "./carts.service.js";
import { AuthRequest } from "../../middleware/auth.middleware.js";
import { serializeBigInt } from "../../utils/serialize.js";
import { addToCartSchema } from "./cart.validation.js";

export const craeteCartHandler = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        const validatedData = addToCartSchema.parse(req.body);

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const cart = await cartService.addToCart(userId, validatedData.productId, validatedData.variantId, validatedData.quantity);

        res.status(200).json({
            data: {
                ...cart,
                id: cart.id.toString(),
                cartId: cart.cartId.toString(),
                productId: cart.productId.toString(),
                variantId: cart.variantId.toString()
            }
        });

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message || "Something went wrong" });
    }
};

export const getCartHandler = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const cart = await cartService.getCart(userId);

        res.status(200).json({
            success: true,
            data: serializeBigInt(cart)
        });

    } catch (error: any) {
        res.status(500).json({
            error: error.message || "Something went wrong"
        });
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

        const safeData = serializeBigInt(result)

        res.status(200).json({
            success: true,
            message: "Cart updated successfully",
            data: safeData
        });

    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message
        });
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
        const safeData = serializeBigInt(deletedCartItem)
        res.status(200).json({
            message: "Item is removed from cart",
            data: safeData
        })
    } catch (error: any) {
        res.status(400).json({
            message: error.message
        });
    }
}