import { Router } from "express";
import { createProductHandler, deleteProductHandler, getProductsHandler, updateProductHandler } from "./products.controller.js";
import { authUser } from "../../middleware/auth.middleware.js";
import { isAdmin } from "../../middleware/admin.middleware.js";

const router = Router()

router.post("/", authUser, isAdmin, createProductHandler)
router.get("/", getProductsHandler)
router.patch("/:id", authUser, isAdmin, updateProductHandler)
router.delete("/:id", authUser, isAdmin, deleteProductHandler);

export default router