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

export const createUserSchema = z.object({
    firstName: requiredStringWithLength("First name", 2, 50),

    middleName: z.string()
        .transform(val => val.trim())
        .transform(val => val === "" ? undefined : val)
        .optional(),

    lastName: requiredStringWithLength("Last name", 2, 50),

    gender: z.enum(["male", "female", "other"], {
        message: "Gender must be male, female, or other"
    }),

    birthDate: z.preprocess(
        (val) => (typeof val === "string" ? val.trim() : ""),
        z.string()
            .min(1, "Birth date is required")
            .refine((date) => {
                const parsed = new Date(date);
                return !isNaN(parsed.getTime()) && parsed < new Date();
            }, {
                message: "Invalid or future birth date"
            })
    ),

    email: z.preprocess(
        (val) => (typeof val === "string" ? val.trim() : ""),
        z.string()
            .min(1, "Email is required")
            .email("Invalid email format")
            .transform(val => val.toLowerCase().trim())
    ),

    phoneNumber: z.preprocess(
        (val) => (typeof val === "string" ? val.trim() : ""),
        z.string()
            .min(1, "Phone number is required")
            .regex(/^[6-9]\d{9}$/, "Phone must be valid 10-digit Indian number")
    ),
});