import { Request, Response } from "express";
import * as productService from "./products.service.js"
import { serializeBigInt } from "../../utils/serialize.js";
import { createProductSchema, productIdSchema, updateProductSchema } from "./products.validation.js";
import { ZodError } from "zod";
import { errorResponse, successResponse } from "../../utils/response.js";
import { formatZodError } from "../../utils/zodError.js";

export const createProductHandler = async (req: Request, res: Response) => {
    try {
        const validatedData = createProductSchema.parse(req.body)
        const product = await productService.createProduct(BigInt(validatedData.categoryId), BigInt(validatedData.brandId), validatedData.name, validatedData.description || '', validatedData.variants)


        return successResponse(res, "Product created successfully", serializeBigInt(product), null, 201)
    } catch (error: any) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                status: false,
                message: "Validation failed",
                error: formatZodError(error)
            });
        }
        return errorResponse(res, "Failed to create product", error.message || "Failed to create product", 400)
    }
}

export const getProductsHandler = async (req: Request, res: Response) => {
    try {
        const result = await productService.getProducts(req.query);

        const safeData = serializeBigInt(result.data);

        return successResponse(res, "Products fetched successfully", safeData, result.meta)
    } catch (error: any) {
        console.error(error);
        return errorResponse(res, "Failed to fetch products", error.message || "Failed to fetch products", 500)
    }
};

export const updateProductHandler = async (req: Request, res: Response) => {
    try {
        const { id } = productIdSchema.parse(req.params);

        const validatedData = updateProductSchema.parse(req.body);

        const product = await productService.updateProduct(BigInt(id), validatedData);

        return successResponse(res, "Product updated successfully", serializeBigInt(product))

    } catch (error: any) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                status: false,
                message: "Validation failed",
                error: formatZodError(error)
            });
        }
        console.error(error);
        return errorResponse(res, "Failed to update product", error.message || "Failed to update product", 400);
    }
};

export const deleteProductHandler = async (req: Request, res: Response) => {
    try {
        const { id } = req.params

        if (!id || Array.isArray(id)) {
            return res.status(400).json({ message: "Invalid product id" });
        }

        const deletedProduct = await productService.deleteProduct(BigInt(id))

        return successResponse(res, "Product deleted successfully", serializeBigInt(deletedProduct))
    } catch (error: any) {
        console.error(error)
        return errorResponse(res, "Failed to delete product", error.message || "Failed to delete product", 400)
    }
}