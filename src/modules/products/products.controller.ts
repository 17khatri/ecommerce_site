import { Request, Response } from "express";
import * as productService from "./products.service.js"
import { serializeBigInt } from "../../utils/serialize.js";
import { createProductSchema, productIdSchema, updateProductSchema } from "./products.validation.js";
import { ZodError } from "zod";

export const createProductHandler = async (req: Request, res: Response) => {
    try {
        const validatedData = createProductSchema.parse(req.body)
        const product = await productService.createProduct(BigInt(validatedData.categoryId), BigInt(validatedData.brandId), validatedData.name, validatedData.description || '', validatedData.variants)


        return res.status(201).json({
            message: "Product created successfuly",
            data: serializeBigInt(product)
        })
    } catch (error: any) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                error: error.issues.map((e: any) => e.message)
            });
        }
        res.status(400).json({ error: error.message })
    }
}

export const getProductsHandler = async (req: Request, res: Response) => {
    try {
        const result = await productService.getProducts(req.query);

        const safeData = serializeBigInt(result.data);

        return res.status(200).json({
            success: true,
            data: safeData,
            meta: result.meta,
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
        const { id } = productIdSchema.parse(req.params);

        // const { categoryId, brandId, name, description, variants } = updateProductSchema.parse(req.body);
        const validatedData = updateProductSchema.parse(req.body);

        const product = await productService.updateProduct(BigInt(id), validatedData);

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
        if (error instanceof ZodError) {
            return res.status(400).json({
                error: error.issues.map((e: any) => e.message)
            });
        }
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