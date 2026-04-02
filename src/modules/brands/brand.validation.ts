import { z } from "zod";

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

const optionalStringWithLength = (field: string, min: number, max: number) =>
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
            .min(min, `${field} must be at least ${min} characters`)
            .max(max, `${field} must be less than ${max} characters`)
            .optional()
    );

const optionalBoolean = (field: string) =>
    z.preprocess(
        (val) => {
            if (val === undefined) return undefined;
            if (typeof val === "string") {
                if (val === "true") return true;
                if (val === "false") return false;
                return val;
            }
            return val;
        },
        z.boolean({
            message: `${field} must be true or false`
        }).optional()
    );

export const createBrandSchema = z.object({
    name: requiredStringWithLength("Brand name", 1, 255)
        .transform(val => val.toLowerCase()), // optional normalization
});

export const updateBrandSchema = z.object({
    name: optionalStringWithLength("Brand name", 2, 100)
        .transform(val => val?.toLowerCase()),

    status: optionalBoolean("Status"),
})
    .refine(
        (data) => data.name !== undefined || data.status !== undefined,
        {
            message: "At least one field (name or status) is required",
        }
    );

export const brandIdSchema = z.object({
    id: z.string().regex(/^\d+$/, "Invalid brand id"),
});