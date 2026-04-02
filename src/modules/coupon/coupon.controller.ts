import { couponIdSchema, createCouponSchema, updateCouponSchema } from "./coupon.validation.js";
import * as couponService from "./coupon.service.js";
import { Request, Response } from "express";
import { ZodError } from "zod";
import { serializeBigInt } from "../../utils/serialize.js";

export const createCouponHandler = async (req: Request, res: Response) => {
    try {
        const data = createCouponSchema.parse(req.body);

        const coupon = await couponService.createCoupon(data);

        res.status(201).json({
            success: true,
            message: "Coupon created successfully",
            data: serializeBigInt(coupon)
        });
    } catch (error: any) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                error: error.issues.map((e: any) => e.message)
            });
        }
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getCouponsHandler = async (req: Request, res: Response) => {
    try {
        const coupons = await couponService.getCoupons();

        res.json({
            success: true,
            data: serializeBigInt(coupons)
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message
        });
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

        return res.json({
            success: true,
            message: "Coupon updated successfully",
            data: serializeBigInt(coupon)
        });

    } catch (error: any) {

        if (error instanceof ZodError) {
            return res.status(400).json({
                error: error.issues.map((e: any) => e.message)
            });
        }

        return res.status(400).json({
            error: error.message
        });
    }
};