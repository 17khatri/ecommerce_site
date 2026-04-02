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

const requiredNumber = (
    field: string,
    options?: {
        min?: number;
        int?: boolean;
    }
) =>
    z.preprocess(
        (val) =>
            val === undefined || val === null || val === ""
                ? NaN
                : Number(val),
        (() => {
            let schema = z.number({
                message: `${field} must be a number`,
            });

            if (options?.int) {
                schema = schema.int(`${field} must be an integer`);
            }

            if (options?.min !== undefined) {
                schema = schema.min(
                    options.min,
                    `${field} must be at least ${options.min}`
                );
            }

            return schema;
        })()
    );

export const createCouponSchema = z.object({
    name: requiredStringWithLength("Name", 2, 100),

    code: requiredStringWithLength("Code", 3, 50)
        .transform((val) => val.toUpperCase()),

    coupon_type: z.enum(["PERCENTAGE", "FIXED"], {
        message: "Coupon type must be PERCENTAGE or FIXED",
    }),

    brand_id: z.preprocess(
        (val) => (val ? BigInt(val as string) : undefined),
        z.bigint().optional()
    ),

    discount_percentage: z.preprocess(
        (val) => (val === undefined ? undefined : Number(val)),
        z.number()
            .min(1, "Discount must be at least 1%")
            .max(100, "Discount cannot exceed 100%")
            .optional()
    ),

    fixed_amount: z.preprocess(
        (val) => (val === undefined ? undefined : Number(val)),
        z.number()
            .min(1, "Fixed amount must be greater than 0")
            .optional()
    ),

    start_date: z.preprocess(
        (val) => (typeof val === "string" ? new Date(val) : val),
        z.date({ message: "Start date is required" })
    ),

    end_date: z.preprocess(
        (val) => (typeof val === "string" ? new Date(val) : val),
        z.date({ message: "End date is required" })
    ),

    min_order_amount: requiredNumber("Minimum order amount", {
        min: 0
    }),

    max_discount_price: z.preprocess(
        (val) => (val === undefined ? undefined : Number(val)),
        z.number()
            .min(1, "Max discount must be greater than 0")
            .optional()
    ),

    max_usage: requiredNumber("Max usage", {
        min: 1,
        int: true
    }),

    used_count: z.preprocess(
        (val) => (val === undefined ? 0 : Number(val)),
        z.number().min(0).optional()
    ),

    created_at: z.preprocess(
        (val) => (val ? new Date(val as string) : new Date()),
        z.date()
    ),
})
    .refine((data) => data.end_date > data.start_date, {
        message: "End date must be after start date",
        path: ["end_date"],
    })
    .refine((data) => {
        if (data.coupon_type === "PERCENTAGE") {
            return data.discount_percentage !== undefined;
        }
        return true;
    }, {
        message: "Discount percentage is required for PERCENTAGE coupons",
        path: ["discount_percentage"],
    })
    .refine((data) => {
        if (data.coupon_type === "FIXED") {
            return data.fixed_amount !== undefined;
        }
        return true;
    }, {
        message: "Fixed amount is required for FIXED coupons",
        path: ["fixed_amount"],
    });


export const updateCouponSchema = z.object({
    name: z.string()
        .min(2, "Name must be at least 2 characters")
        .max(100)
        .transform(val => val.trim())
        .optional(),

    code: z.string()
        .min(3, "Code must be at least 3 characters")
        .max(50)
        .transform(val => val.toUpperCase().trim())
        .optional(),

    coupon_type: z.enum(["PERCENTAGE", "FIXED"]).optional(),

    brand_id: z.preprocess(
        (val) => (val ? BigInt(val as string) : undefined),
        z.bigint().optional()
    ),

    discount_percentage: z.preprocess(
        (val) => (val === undefined ? undefined : Number(val)),
        z.number()
            .min(1, "Discount must be at least 1%")
            .max(100, "Discount cannot exceed 100%")
            .optional()
    ),

    fixed_amount: z.preprocess(
        (val) => (val === undefined ? undefined : Number(val)),
        z.number()
            .min(1, "Fixed amount must be greater than 0")
            .optional()
    ),

    start_date: z.preprocess(
        (val) => (val ? new Date(val as string) : undefined),
        z.date().optional()
    ),

    end_date: z.preprocess(
        (val) => (val ? new Date(val as string) : undefined),
        z.date().optional()
    ),

    min_order_amount: z.preprocess(
        (val) => (val === undefined ? undefined : Number(val)),
        z.number().min(0).optional()
    ),

    max_discount_price: z.preprocess(
        (val) => (val === undefined ? undefined : Number(val)),
        z.number().min(1).optional()
    ),

    max_usage: z.preprocess(
        (val) => (val === undefined ? undefined : Number(val)),
        z.number().int().min(1).optional()
    ),

    status: z.preprocess(
        (val) => val === "true" || val === true,
        z.boolean().optional()
    ),
})
    .refine((data) => {
        return Object.keys(data).length > 0;
    }, {
        message: "At least one field is required to update"
    })
    .refine((data) => {
        if (data.coupon_type === "PERCENTAGE") {
            return data.discount_percentage !== undefined;
        }
        return true;
    }, {
        message: "Discount percentage required for PERCENTAGE",
        path: ["discount_percentage"]
    })
    .refine((data) => {
        if (data.coupon_type === "FIXED") {
            return data.fixed_amount !== undefined;
        }
        return true;
    }, {
        message: "Fixed amount required for FIXED",
        path: ["fixed_amount"]
    });

export const couponIdSchema = z.object({
    id: z.string().regex(/^\d+$/, "Invalid coupon id")
});