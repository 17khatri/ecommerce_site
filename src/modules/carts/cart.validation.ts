import { z } from "zod";

export const addToCartSchema = z.object({
    productId: z.coerce.bigint({
        message: "productId must be a valid number"
    }),

    variantId: z.coerce.bigint({
        message: "variantId must be a valid number"
    }),

    quantity: z.coerce.number({
        message: "Quantity must be a number"
    })
        .int("Quantity must be an integer")
        .min(1, "Quantity must be at least 1")
});