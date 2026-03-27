import express from "express";
import { upload } from "../../middleware/upload.js";
import { deleteProductImage, uploadProductImages } from "./productImage.controller.js";

const router = express.Router();

router.post(
    "/upload",
    upload.array("images", 5),
    uploadProductImages
);

router.delete(
    "/:imageId",
    deleteProductImage
);

export default router;