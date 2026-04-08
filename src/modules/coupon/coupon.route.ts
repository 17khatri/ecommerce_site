import { Router } from "express";
import { authUser } from "../../middleware/auth.middleware.js";
import { isAdmin } from "../../middleware/admin.middleware.js";
import { createCouponHandler, getCouponsHandler, updateCouponHandler } from "./coupon.controller.js";

const route = Router();

route.get("/", getCouponsHandler)
route.post("/", authUser, isAdmin, createCouponHandler)
route.put("/:id", authUser, isAdmin, updateCouponHandler)

export default route