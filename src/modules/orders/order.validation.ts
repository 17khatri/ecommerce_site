import { z } from "zod";

// ✅ Order Item validation
const orderItemSchema = z.object({
    productId: z.coerce.bigint({
        message: "productId must be a valid number"
    }),

    variantId: z.coerce.bigint({
        message: "variantId must be a valid number"
    }),

    quantity: z.coerce.number({
        message: "Quantity must be a number"
    })
        .int("Quantity must be integer")
        .min(1, "Quantity must be at least 1")
});

// ✅ Main Order validation
export const createOrderSchema = z.object({
    sessionId: z.string().optional(),

    fullName: z.string()
        .min(2, "Full name must be at least 2 characters")
        .max(100)
        .transform(val => val.trim()),

    city: z.string()
        .min(2, "City is required")
        .max(100)
        .transform(val => val.trim()),

    zipCode: z.coerce.number({
        message: "Zip code must be a number"
    })
        .int("Zip code must be integer")
        .min(100000, "Invalid zip code")
        .max(999999, "Invalid zip code"),

    state: z.string()
        .min(2, "State is required")
        .max(100)
        .transform(val => val.trim()),

    address: z.string()
        .min(5, "Address too short")
        .max(500)
        .transform(val => val.trim()),

    paymentMethod: z.enum(["COD", "ONLINE"], {
        message: "Invalid payment method"
    }),

    items: z.array(orderItemSchema)
        .min(1, "At least one item is required")
});