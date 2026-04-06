import { Request, Response } from "express";
import * as categoryService from "./category.service.js";
import { serializeBigInt } from "../../utils/serialize.js";
import { categoryIdSchema, createCategorySchema, updateCategorySchema } from "./category.validation.js";
import { ZodError } from "zod";
import { errorResponse, successResponse } from "../../utils/response.js";
import { formatZodError } from "../../utils/zodError.js";

export const createCategoryHandler = async (req: Request, res: Response) => {
    try {
        const validateData = createCategorySchema.parse(req.body);

        const category = await categoryService.createCategory(validateData.name, validateData.parentId);

        return successResponse(res, "Category created", serializeBigInt(category), null, 201)
    } catch (error: any) {

        if (error instanceof ZodError) {
            return res.status(400).json({
                status: false,
                message: "Validation failed",
                error: formatZodError(error)
            });
        }

        return errorResponse(res, "Failed to create category", error.message || "Failed to create category", 400)
    }
};

export const getCategoryHandler = async (req: Request, res: Response) => {
    try {
        const result = await categoryService.getCategories(req.query);
        const safeData = serializeBigInt(result.data);

        return successResponse(res, "Categories fetched successfully", safeData, result.meta)
    } catch (error: any) {
        console.error(error);
        return errorResponse(res, "Failed to fetch categories", error.message || "Failed to fetch categories", 500)
    }
};

export const deleteCategoryHandler = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;

        const result = await categoryService.deleteCategory(id);

        return successResponse(res, "Category deleted successfully", serializeBigInt(result))
    } catch (error: any) {
        return errorResponse(res, "Failed to delete category", error.message || "Failed to delete category", 400)
    }
};

export const updateCategoryHandler = async (req: Request, res: Response) => {
    try {
        const { id } = categoryIdSchema.parse(req.params);

        const validatedData = updateCategorySchema.parse(req.body);

        const category = await categoryService.updateCategory(
            id,
            validatedData.name,
            validatedData.parentId
        );

        return successResponse(res, "Category updated successfully", serializeBigInt(category))
    } catch (error: any) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                status: false,
                message: "Validation failed",
                error: formatZodError(error)
            });
        }
        return errorResponse(res, "Failed to update category", error.message || "Failed to update category", 400)
    }
};