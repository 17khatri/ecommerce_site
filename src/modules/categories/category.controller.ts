import { Request, Response } from "express";
import * as categoryService from "./category.service.js";
import { serializeBigInt } from "../../utils/serialize.js";
import { categoryIdSchema, createCategorySchema, updateCategorySchema } from "./category.validation.js";
import { ZodError } from "zod";

export const createCategoryHandler = async (req: Request, res: Response) => {
    try {
        const validateData = createCategorySchema.parse(req.body);

        const category = await categoryService.createCategory(validateData.name, validateData.parentId);

        res.status(201).json({
            message: "Category created",
            data: {
                ...category,
                id: category.id.toString(),
                parentId: category.parentId?.toString(),
            },
        });
    } catch (error: any) {

        if (error instanceof ZodError) {
            return res.status(400).json({
                error: error.issues.map((e: any) => e.message)
            });
        }

        res.status(500).json({
            error: error.message,
        });
    }
};

export const getCategoryHandler = async (req: Request, res: Response) => {
    try {
        const result = await categoryService.getCategories(req.query);
        const safeData = serializeBigInt(result.data);

        res.json({
            data: safeData,
            meta: result.meta,
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch categories" });
    }
};

export const deleteCategoryHandler = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;

        const result = await categoryService.deleteCategory(id);

        res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message
        });
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

        res.status(200).json({
            success: true,
            message: "Category updated successfully",
            data: {
                ...category,
                id: category.id.toString(),
                parentId: category.parentId?.toString() || null
            }
        });
    } catch (error: any) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                error: error.issues.map((e: any) => e.message)
            });
        }
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};