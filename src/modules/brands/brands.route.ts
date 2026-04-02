import { Router } from "express";
import { isAdmin } from "../../middleware/admin.middleware.js";
import { authUser } from "../../middleware/auth.middleware.js";
import { createBrandHandler, deleteBrandhandler, getBrandsHandler, updateBrandHandler } from "./brands.controller.js";

const router = Router()

router.post("/", authUser, isAdmin, createBrandHandler)

router.get("/", getBrandsHandler)

router.delete("/:id", authUser, isAdmin, deleteBrandhandler)

router.put("/:id", authUser, isAdmin, updateBrandHandler)

export default router