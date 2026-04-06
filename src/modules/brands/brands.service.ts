import prisma from "../../prisma/client.js";

export const createBrand = async (name: string) => {

    const normalizedName = name.trim().toLowerCase();

    const existing = await prisma.brand.findFirst({
        where: {
            name: normalizedName,
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
            name: normalizedName
        }
    })
}

export const getBrands = async (query: any) => {
    const {
        page = 1,
        limit = 10,
        search = "",
        sortBy = "createdAt",
        order = "desc",
        status
    } = query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const allowedSortFields = ["name", "createdAt"];
    const sortField = allowedSortFields.includes(sortBy)
        ? sortBy
        : "createdAt";

    const sortOrder: "asc" | "desc" =
        ["asc", "az"].includes(order) ? "asc" : "desc";

    const where: any = {
        deletedAt: null,
    };

    if (status !== undefined) {
        where.status = status === "true" || status === true;
    }

    if (search) {
        where.name = {
            contains: search,
        };
    }

    const [brands, total] = await Promise.all([
        prisma.brand.findMany({
            where,
            skip,
            take: limitNumber,
            orderBy: {
                [sortField]: sortOrder,
            },
        }),
        prisma.brand.count({ where }),
    ]);

    return {
        data: brands,
        meta: {
            total,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(total / limitNumber),
        },
    };
};

export const deleteBrand = async (id: string) => {
    const brandId = Number(id);
    const now = new Date()
    console.log("Attempting to delete brand with id:", brandId);
    const brand = await prisma.brand.findFirst({
        where: {
            id: brandId,
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