import { Router } from "express";
import { craeteCartHandler, getCartHandler } from "./carts.controller.js";
import { authUser } from "../../middleware/auth.middleware.js";

const router = Router()

router.post("/", authUser, craeteCartHandler)
router.get("/", authUser, getCartHandler)
export default router