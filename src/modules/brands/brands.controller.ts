import { Request, Response } from "express"
import * as brandService from "./brands.service.js"

export const createBrandHandler = async (req: Request, res: Response) => {
    try {
        const { name } = await req.body

        const brand = await brandService.createBrand(name)

        res.status(201).json({
            message: "Brand is created",
            data: {
                ...brand,
                id: brand.id.toString()
            }
        })
    } catch (error: any) {
        res.status(400).json({ error: error.message })
    }
}

export const getBrandsHandler = async (_req: Request, res: Response) => {
    try {
        const brands = await brandService.getBrands()

        const result = brands.map(b => ({
            ...b,
            id: b.id.toString()
        }))
        res.json({ data: result })
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch brands" })
    }
}

export const updateBrandHandler = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { name, status } = req.body;

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