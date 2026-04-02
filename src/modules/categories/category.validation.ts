import { z } from "zod";

// 🔥 Reusable helpers
const requiredStringWithLength = (
    field: string,
    min: number,
    max: number
) =>
    z.preprocess(
        (val) => (typeof val === "string" ? val.trim() : ""),
        z.string()
            .min(1, `${field} is required`)
            .min(min, `${field} must be at least ${min} characters`)
            .max(max, `${field} must be less than ${max} characters`)
    );

const optionalStringWithLength = (min: number, max: number) =>
    z.preprocess(
        (val) => {
            if (val === undefined) return undefined;
            if (typeof val === "string") {
                const trimmed = val.trim();
                return trimmed === "" ? undefined : trimmed;
            }
            return val;
        },
        z.string()
            .min(min, `Must be at least ${min} characters`)
            .max(max, `Must be less than ${max} characters`)
            .optional()
    );

const optionalNumericString = (field: string) =>
    z.preprocess(
        (val) => {
            if (val === undefined) return undefined;
            if (typeof val === "string") {
                const trimmed = val.trim();
                return trimmed === "" ? undefined : trimmed;
            }
            return val;
        },
        z.string()
            .regex(/^\d+$/, `${field} must be a valid number`)
            .optional()
    );


export const createCategorySchema = z.object({
    name: requiredStringWithLength("Category name", 2, 50),

    parentId: optionalNumericString("Parent ID"),
});

export const updateCategorySchema = z.object({
    name: optionalStringWithLength(2, 100),

    parentId: optionalNumericString("Parent ID"),
})
    .refine(
        (data) => data.name !== undefined || data.parentId !== undefined,
        {
            message: "At least one field (name or parentId) is required",
        }
    );

export const categoryIdSchema = z.object({
    id: z.string().regex(/^\d+$/, "Invalid category id"),
});