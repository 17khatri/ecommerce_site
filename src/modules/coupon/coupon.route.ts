import { Router } from "express";
import { authUser } from "../../middleware/auth.middleware.js";
import { isAdmin } from "../../middleware/admin.middleware.js";
import { createCouponHandler, getCouponsHandler } from "./coupon.controller.js";

const route = Router();

route.get("/", authUser, isAdmin, getCouponsHandler)
route.post("/", authUser, isAdmin, createCouponHandler)

export default route