import { Request, Response } from "express"
import * as brandService from "./brands.service.js"
import { serializeBigInt } from "../../utils/serialize.js"
import { brandIdSchema, createBrandSchema, updateBrandSchema } from "./brand.validation.js"
import { ZodError } from "zod"
import { errorResponse, successResponse } from "../../utils/response.js"
import { formatZodError } from "../../utils/zodError.js"

export const createBrandHandler = async (req: Request, res: Response) => {
    try {

        const validatedData = createBrandSchema.parse(req.body)
        const brand = await brandService.createBrand(validatedData.name)

        return successResponse(res, "Brand created successfully", serializeBigInt(brand), null, 201)
    } catch (error: any) {

        if (error instanceof ZodError) {
            return res.status(400).json({
                status: false,
                message: "Validation failed",
                error: formatZodError(error)
            });
        }

        return errorResponse(res, "Failed to create brand", error.message || "Failed to create brand", 400)
    }
}

export const getBrandsHandler = async (req: Request, res: Response) => {
    try {
        const result = await brandService.getBrands(req.query);

        const safeData = serializeBigInt(result.data);

        return successResponse(res, "Brands fetched successfully", safeData, result.meta)
    } catch (error: any) {
        console.error(error);
        return errorResponse(res, "Failed to fetch brands", error.message || "Failed to fetch brands", 500)
    }
};

export const updateBrandHandler = async (req: Request, res: Response) => {
    try {
        const { id } = brandIdSchema.parse(req.params);
        const { name, status } = updateBrandSchema.parse(req.body);

        const brand = await brandService.updateBrand(id, name, status);

        return successResponse(res, "Brand updated successfully", serializeBigInt(brand))
    } catch (error: any) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                status: false,
                message: "Validation failed",
                error: formatZodError(error)
            });
        }
        return errorResponse(res, "Failed to update brand", error.message || "Failed to update brand", 400)
    }
};

export const deleteBrandhandler = async (req: Request, res: Response) => {
    try {
        const id = req.params.id
        console.log("Deleting brand with id:", id);
        const result = await brandService.deleteBrand(id)

        return successResponse(res, "Brand deleted successfully", serializeBigInt(result))
    } catch (error: any) {
        return errorResponse(res, "Failed to delete brand", error.message || "Failed to delete brand", 400)
    }
}