import prisma from "../../prisma/client.js";
import fs from "fs/promises";
import path from "path";

export const uploadProductImagesService = async (req: any) => {
    const files = req.files as Express.Multer.File[];
    const { productId, primaryIndex, existingImageIds } = req.body;

    if (!productId) {
        throw new Error("productId is required");
    }

    const productIdBigInt = BigInt(productId);

    // ✅ Parse existing image IDs (coming from frontend)
    const existingIds: bigint[] = existingImageIds
        ? JSON.parse(existingImageIds).map((id: string) => BigInt(id))
        : [];

    // 🔍 1. Get all current images from DB
    const currentImages = await prisma.productImage.findMany({
        where: { productId: productIdBigInt },
    });

    // 🔥 2. Find images to delete
    const imagesToDelete = currentImages.filter(
        (img) => !existingIds.includes(img.id)
    );

    // 🗑️ 3. Delete from local + DB
    for (const img of imagesToDelete) {
        try {
            await fs.unlink(path.resolve(img.imagePath)); // delete file
        } catch (err) {
            console.warn("File not found:", img.imagePath);
        }
    }

    if (imagesToDelete.length > 0) {
        await prisma.productImage.deleteMany({
            where: {
                id: {
                    in: imagesToDelete.map((img) => img.id),
                },
            },
        });
    }

    // =============================
    // ✅ HANDLE NEW UPLOADS
    // =============================

    if (!files || files.length === 0) {
        return { message: "Images updated (only deletion done)" };
    }

    const primaryIdx =
        primaryIndex !== undefined ? Number(primaryIndex) : -1;

    if (primaryIdx >= files.length) {
        throw new Error("Invalid primaryIndex");
    }

    // 🔍 Check existing primary
    const existingPrimary = await prisma.productImage.findFirst({
        where: {
            productId: productIdBigInt,
            isPrimary: true,
        },
    });

    // 🔥 Reset primary if new one provided
    if (primaryIdx >= 0) {
        await prisma.productImage.updateMany({
            where: { productId: productIdBigInt },
            data: { isPrimary: false },
        });
    }

    const imageData = files.map((file, index) => ({
        productId: productIdBigInt,
        imagePath: file.path,
        isPrimary:
            primaryIdx >= 0
                ? index === primaryIdx
                : !existingPrimary && index === 0,
    }));

    await prisma.productImage.createMany({
        data: imageData,
    });

    // 🔗 Response
    const baseUrl = `${req.protocol}://${req.get("host")}/`;

    const response = imageData.map((img) => ({
        productId: img.productId.toString(),
        imagePath: img.imagePath,
        imageUrl: baseUrl + img.imagePath,
        isPrimary: img.isPrimary,
    }));

    return response;
};