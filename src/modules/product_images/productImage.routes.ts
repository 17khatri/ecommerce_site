import express from "express";
import { upload } from "../../middleware/upload.js";
import { uploadProductImages } from "./productImage.controller.js";

const router = express.Router();

router.post(
    "/upload",
    upload.array("images", 5),
    uploadProductImages // ✅ no logic here
);

export default router;