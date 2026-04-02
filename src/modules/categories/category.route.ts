import { Router } from "express";
import {
    createCategoryHandler,
    deleteCategoryHandler,
    getCategoryHandler,
    updateCategoryHandler,
} from "./category.controller.js";

import { authUser } from "../../middleware/auth.middleware.js";
import { isAdmin } from "../../middleware/admin.middleware.js";

const router = Router();

router.post("/", authUser, isAdmin, createCategoryHandler);

router.get("/", getCategoryHandler);

router.delete("/:id", authUser, isAdmin, deleteCategoryHandler)

router.put("/:id", authUser, isAdmin, updateCategoryHandler)
export default router;