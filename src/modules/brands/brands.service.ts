import prisma from "../../prisma/client.js";

export const createBrand = async (name: string) => {

    const existing = await prisma.brand.findFirst({
        where: {
            name,
        }
    })

    if (existing) {
        if (existing.deletedAt) {
            return prisma.brand.update({
                where: {
                    id: existing.id
                },
                data: {
                    deletedAt: null
                }
            })
        }
        throw new Error("Brand already exists")
    }
    return prisma.brand.create({
        data: {
            name
        }
    })
}

export const getBrands = async (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;

    const [brands, total] = await Promise.all([
        prisma.brand.findMany({
            where: {
                deletedAt: null,
                status: true
            },
            skip,
            take: limit,
            orderBy: {
                createdAt: "desc"
            }
        }),
        prisma.brand.count({
            where: {
                deletedAt: null,
                status: true
            }
        })
    ]);

    return {
        data: brands,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};

export const deleteBrand = async (id: string) => {
    const brandId = BigInt(id);
    const now = new Date()
    const brand = await prisma.brand.findFirst({
        where: {
            id: brandId,
            deletedAt: null
        }
    })

    if (!brand) {
        throw new Error("Brand not found")
    }

    await prisma.brand.update({
        where: {
            id: brandId,
        },
        data: {
            deletedAt: now
        }
    })

    return { message: "Brand is deleted" }
}

export const updateBrand = async (
    id: string,
    name?: string,
    status?: boolean
) => {
    const brandId = BigInt(id);

    // 1. Check brand exists
    const brand = await prisma.brand.findFirst({
        where: {
            id: brandId,
            deletedAt: null
        }
    });

    if (!brand) {
        throw new Error("Brand not found");
    }

    // 2. Validate name
    if (name !== undefined && name.trim() === "") {
        throw new Error("Brand name cannot be empty");
    }

    // 3. Check duplicate name (optional but recommended)
    if (name) {
        const existing = await prisma.brand.findFirst({
            where: {
                name: name.trim(),
                deletedAt: null,
                NOT: { id: brandId }
            }
        });

        if (existing) {
            throw new Error("Brand already exists");
        }
    }

    // 4. Update
    const updated = await prisma.brand.update({
        where: { id: brandId },
        data: {
            ...(name && { name: name.trim() }),
            ...(status !== undefined && { status })
        }
    });

    return updated;
};