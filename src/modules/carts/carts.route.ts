import { Router } from "express";
import { craeteCartHandler, deleteCartHandler, getCartHandler, updateCartItemHandler } from "./carts.controller.js";
import { authUser } from "../../middleware/auth.middleware.js";

const router = Router()

router.post("/", authUser, craeteCartHandler)
router.get("/", authUser, getCartHandler)
router.put("/update", authUser, updateCartItemHandler)
router.delete("/remove", authUser, deleteCartHandler)
export default router