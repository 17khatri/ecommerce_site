import { Router } from "express";
import { craeteCartHandler, deleteCartHandler, getCartHandler, updateCartItemHandler } from "./carts.controller.js";
import { authUser } from "../../middleware/auth.middleware.js";

const router = Router()

router.post("/", authUser, craeteCartHandler)
router.get("/", authUser, getCartHandler)
router.patch("/updateQuantity", authUser, updateCartItemHandler)
router.delete("/remove", authUser, deleteCartHandler)
export default router