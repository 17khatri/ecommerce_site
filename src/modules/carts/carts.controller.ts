import { Response } from "express";
import * as cartService from "./carts.service.js";
import { AuthRequest } from "../../middleware/auth.middleware.js";

export const craeteCartHandler = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        const { productId, variantId, quantity } = req.body

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (!productId || !variantId || !quantity) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const cart = await cartService.addToCart(userId, BigInt(productId), BigInt(variantId), quantity);

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

const serializeBigInt = (data: any) => {
    return JSON.parse(
        JSON.stringify(data, (_, value) =>
            typeof value === "bigint" ? value.toString() : value
        )
    );
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