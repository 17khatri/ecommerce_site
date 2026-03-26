import { Request, Response } from "express";
import * as productService from "./products.service.js"

export const createProductHandler = async (req: Request, res: Response) => {
    try {
        const { categoryId, brandId, name, description, variants } = req.body

        if (!categoryId || !brandId || !name || !variants.length) {
            return res.status(400).json({
                success: false,
                message: "categoryId, brandId, name and variants is required"
            })
        }

        const product = await productService.createProduct(BigInt(categoryId), BigInt(brandId), name, description, variants)

        const serialized = JSON.parse(
            JSON.stringify(product, (_, value) =>
                typeof value === "bigint" ? value.toString() : value
            )
        );

        return res.status(201).json({
            message: "Product created successfuly",
            data: serialized
        })
    } catch (error: any) {
        res.status(400).json({ error: error.message })
    }
}

export const getProductsHandler = async (_req: Request, res: Response) => {
    try {
        const products = await productService.getProducts();

        const serialized = JSON.parse(
            JSON.stringify(products, (_, value) =>
                typeof value === "bigint" ? value.toString() : value
            )
        );

        return res.status(200).json({
            success: true,
            data: serialized,
        });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const updateProductHandler = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!id || Array.isArray(id)) {
            return res.status(400).json({ message: "Invalid product id" });
        }

        const { categoryId, brandId, name, description, variants } = req.body;

        const product = await productService.updateProduct(BigInt(id), {
            categoryId: categoryId ? BigInt(categoryId) : undefined,
            brandId: brandId ? BigInt(brandId) : undefined,
            name,
            description,
            variants, // can be undefined
        });

        const serialized = JSON.parse(
            JSON.stringify(product, (_, value) =>
                typeof value === "bigint" ? value.toString() : value
            )
        );

        return res.json({
            success: true,
            data: serialized,
        });
    } catch (error: any) {
        console.error(error);
        return res.status(400).json({ error: error.message });
    }
};

export const deleteProductHandler = async (req: Request, res: Response) => {
    try {
        const { id } = req.params

        if (!id || Array.isArray(id)) {
            return res.status(400).json({ message: "Invalid product id" });
        }

        await productService.deleteProduct(BigInt(id))

        return res.json({
            success: true,
            message: "Product deleted successfully"
        })
    } catch (error: any) {
        console.error(error)
        return res.status(400).json({
            success: false,
            message: error.message
        })
    }
}