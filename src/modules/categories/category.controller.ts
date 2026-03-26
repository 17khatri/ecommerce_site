import { Request, Response } from "express";
import * as categoryService from "./category.service.js";

export const createCategoryHandler = async (req: Request, res: Response) => {
    try {
        const { name, parentId } = req.body;

        const category = await categoryService.createCategory(name, parentId);

        res.status(201).json({
            message: "Category created",
            data: {
                ...category,
                id: category.id.toString(),
                parentId: category.parentId?.toString(),
            },
        });
    } catch (error: any) {
        res.status(500).json({
            error: error.message,
        });
    }
};

export const getCategoryHandler = async (_req: Request, res: Response) => {

    try {
        const categories = await categoryService.getCategories();

        const formatCategory = (c: any): any => ({
            ...c,
            id: c.id.toString(),
            parentId: c.parentId ? c.parentId.toString() : null,
            children: c.children?.map(formatCategory) || [],
        });

        const result = categories.map(formatCategory);


        res.json({ data: result });
    } catch (error) {
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
        const id = req.params.id as string;
        const { name, parentId } = req.body;

        const category = await categoryService.updateCategory(
            id,
            name,
            parentId
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
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};