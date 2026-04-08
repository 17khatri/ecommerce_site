import { couponIdSchema, createCouponSchema, updateCouponSchema } from "./coupon.validation.js";
import * as couponService from "./coupon.service.js";
import { Request, Response } from "express";
import { ZodError } from "zod";
import { serializeBigInt } from "../../utils/serialize.js";
import { errorResponse, successResponse } from "../../utils/response.js";

export const createCouponHandler = async (req: Request, res: Response) => {
    try {
        const data = createCouponSchema.parse(req.body);

        const coupon = await couponService.createCoupon(data);

        return successResponse(res, "Coupon created successfully", serializeBigInt(coupon), null, 201)
    } catch (error: any) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                error: error.issues.map((e: any) => e.message)
            });
        }
        return errorResponse(res, "Failed to create coupon", error.message || "Failed to create coupon", 500)
    }
};

export const getCouponsHandler = async (req: Request, res: Response) => {
    try {
        const coupons = await couponService.getCoupons();

        return successResponse(res, "Coupons retrieved successfully", serializeBigInt(coupons))
    } catch (error: any) {
        return errorResponse(res, "Failed to retrieve coupons", error.message || "Something went wrong", 500);
    }
}

export const updateCouponHandler = async (req: Request, res: Response) => {
    try {
        const { id } = couponIdSchema.parse(req.params);

        if (!id) {
            return res.status(400).json({ error: "Coupon ID is required" });
        }

        const validatedData = updateCouponSchema.parse(req.body);

        const coupon = await couponService.updateCoupon(id, validatedData);

        return successResponse(res, "Coupon updated successfully", serializeBigInt(coupon))

    } catch (error: any) {

        if (error instanceof ZodError) {
            return res.status(400).json({
                error: error.issues.map((e: any) => e.message)
            });
        }

        return errorResponse(res, "Failed to update coupon", error.message || "Failed to update coupon", 500)
    }
};