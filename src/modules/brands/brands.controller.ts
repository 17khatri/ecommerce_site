import { Request, Response } from "express"
import * as brandService from "./brands.service.js"
import { serializeBigInt } from "../../utils/serialize.js"
import { brandIdSchema, createBrandSchema, updateBrandSchema } from "./brand.validation.js"
import { ZodError } from "zod"

export const createBrandHandler = async (req: Request, res: Response) => {
    try {

        const validatedData = createBrandSchema.parse(req.body)
        const brand = await brandService.createBrand(validatedData.name)

        res.status(201).json({
            message: "Brand is created",
            data: serializeBigInt(brand)
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

export const getBrandsHandler = async (req: Request, res: Response) => {
    try {
        const result = await brandService.getBrands(req.query);

        const safeData = serializeBigInt(result.data);

        res.json({
            data: safeData,
            meta: result.meta,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch brands" });
    }
};

export const updateBrandHandler = async (req: Request, res: Response) => {
    try {
        const { id } = brandIdSchema.parse(req.params);
        const { name, status } = updateBrandSchema.parse(req.body);

        const brand = await brandService.updateBrand(id, name, status);

        res.status(200).json({
            success: true,
            message: "Brand updated successfully",
            data: {
                ...brand,
                id: brand.id.toString()
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

export const deleteBrandhandler = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string

        const result = await brandService.deleteBrand(id)

        res.status(200).json({
            success: true,
            message: result.message
        })
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message
        })
    }
}