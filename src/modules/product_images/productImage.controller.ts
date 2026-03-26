import { uploadProductImagesService } from "./productImage.service.js";

export const uploadProductImages = async (req: any, res: any) => {
    try {
        const result = await uploadProductImagesService(req);

        res.json({
            message: "Images uploaded successfully",
            data: result,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};