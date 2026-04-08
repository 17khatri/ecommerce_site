import { Request, Response } from "express";
import { errorResponse, successResponse } from "../../utils/response.js";
import * as productImageService from "./productImage.service.js";

export const uploadProductImages = async (req: any, res: any) => {
    try {
        const result = await productImageService.uploadProductImagesService(req);

        return successResponse(res, "Images uploaded successfully", result, null, 201)
    } catch (error: any) {
        return errorResponse(res, "Failed to upload images", error.message || "Failed to upload images", 500)
    }
};

export const getProductImages = async (req: Request, res: Response) => {
    try {
        const productId = req.params.productId as string;

        const result = await productImageService.getProductImagesSerice(productId);

        return successResponse(res, "Images retrieved successfully", result)
    } catch (error: any) {
        return errorResponse(res, "Failed to retrieve images", error.message || "Failed to retrieve images", 500)
    }
}

export const deleteProductImage = async (req: any, res: any) => {
    try {
        const { imageId } = req.params;

        const result = await productImageService.deleteProductImageService(imageId);

        return successResponse(res, "Image deleted successfully", result)
    } catch (error: any) {
        return errorResponse(res, "Failed to delete image", error.message || "Failed to delete image", 500)
    }
};