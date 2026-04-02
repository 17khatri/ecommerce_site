import { z } from "zod";


// 🔥 Helpers
const requiredStringWithLength = (field: string, min: number, max: number) =>
    z.preprocess(
        (val) => (typeof val === "string" ? val.trim() : ""),
        z.string()
            .min(1, `${field} is required`)
            .min(min, `${field} must be at least ${min} characters`)
            .max(max, `${field} must be less than ${max} characters`)
    );

const optionalString = () =>
    z.preprocess(
        (val) => {
            if (val === undefined) return undefined;
            if (typeof val === "string") {
                const trimmed = val.trim();
                return trimmed === "" ? undefined : trimmed;
            }
            return val;
        },
        z.string().optional()
    );

const requiredNumericString = (field: string) =>
    z.preprocess(
        (val) => (typeof val === "string" ? val.trim() : ""),
        z.string()
            .min(1, `${field} is required`)
            .regex(/^\d+$/, `${field} must be a valid number`)
    );

const variantSchema = z.object({
    price: z.preprocess(
        (val) => Number(val),
        z.number().positive("Price must be greater than 0")
    ),

    quantity: z.preprocess(
        (val) => Number(val),
        z.number().int("Quantity must be integer").min(0, "Quantity cannot be negative")
    ),

    color: optionalString()
        .refine((val) => !val || val.length >= 2, {
            message: "Color must be at least 2 characters",
        }),

    size: optionalString()
        .refine((val) => !val || val.length >= 1, {
            message: "Size must be at least 1 character",
        }),
});

export const createProductSchema = z.object({
    categoryId: requiredNumericString("Category ID"),

    brandId: requiredNumericString("Brand ID"),

    name: requiredStringWithLength("Product name", 2, 150),

    description: optionalString()
        .refine((val) => !val || val.length <= 2000, {
            message: "Description too long",
        }),

    variants: z.array(variantSchema)
        .min(1, "At least one variant is required"),
});

const updateVariantSchema = z.object({
    id: z.preprocess(
        (val) => (val === undefined ? undefined : BigInt(val as string)),
        z.bigint().optional()
    ),

    price: z.preprocess(
        (val) => Number(val),
        z.number().positive("Price must be greater than 0")
    ),

    quantity: z.preprocess(
        (val) => Number(val),
        z.number().int("Quantity must be integer").min(0)
    ),

    color: optionalString(),

    size: optionalString(),
});

export const updateProductSchema = z.object({
    categoryId: z.preprocess(
        (val) => (val === undefined ? undefined : BigInt(val as string)),
        z.bigint().optional()
    ),

    brandId: z.preprocess(
        (val) => (val === undefined ? undefined : BigInt(val as string)),
        z.bigint().optional()
    ),

    name: optionalString()
        .refine((val) => !val || val.length >= 2, {
            message: "Product name must be at least 2 characters",
        }),

    description: optionalString()
        .refine((val) => !val || val.length <= 2000, {
            message: "Description too long",
        }),

    variants: z.array(updateVariantSchema)
        .min(1, "At least one variant is required")
        .optional(),
})
    .refine(
        (data) =>
            data.categoryId !== undefined ||
            data.brandId !== undefined ||
            data.name !== undefined ||
            data.description !== undefined ||
            data.variants !== undefined,
        {
            message: "At least one field is required to update",
        }
    );


export const productIdSchema = z.object({
    id: z.string().regex(/^\d+$/, "Invalid product id"),
});