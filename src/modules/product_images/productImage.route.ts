import express from "express";
import { upload } from "../../middleware/upload.js";
import { deleteProductImage, getProductImages, uploadProductImages } from "./productImage.controller.js";
import { authUser } from "../../middleware/auth.middleware.js";
import { isAdmin } from "../../middleware/admin.middleware.js";

const router = express.Router();

router.post(
    "/upload",
    authUser,
    isAdmin,
    upload.array("images", 5),
    uploadProductImages
);

router.delete(
    "/:imageId",
    authUser,
    isAdmin,
    deleteProductImage
);

router.get(
    "/:productId",
    getProductImages
)

export default router;