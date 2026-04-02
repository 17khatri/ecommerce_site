import prisma from "../../prisma/client.js";

type VariantInput = {
    id?: bigint;
    price: number;
    quantity: number;
    color?: string;
    size?: string;
}

type UpdatePrductInput = {
    categoryId?: bigint;
    brandId?: bigint;
    name?: string
    description?: string;
    variants?: VariantInput[]
}

export const createProduct = async (categoryId: bigint, brandId: bigint, name: string, description: string, variants: VariantInput[]) => {

    return prisma.$transaction(async (tx) => {

        const product = await tx.product.create({
            data: {
                categoryId,
                brandId,
                name,
                description
            }
        });

        const createdVariants = [];

        for (const variant of variants) {
            const v = await tx.productVariant.create({
                data: {
                    productId: product.id,
                    price: variant.price,
                    quantity: variant.quantity,
                    color: variant.color,
                    size: variant.size,
                    sku: "TEMP"
                }
            });

            const sku = `ECS${1000 + Number(v.id)}`;

            const updatedVariant = await tx.productVariant.update({
                where: { id: v.id },
                data: { sku }
            });

            createdVariants.push(updatedVariant);
        }

        return {
            ...product,
            variants: createdVariants
        };
    });
};

export const getProducts = async (query: any) => {
    const {
        page = 1,
        limit = 10,
        search = "",
        sortBy = "createdAt",
        order = "desc",
        status,
        categoryId,
        brandId
    } = query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // ✅ Allowed sorting fields
    const allowedSortFields = ["name", "price", "createdAt"];
    const sortField = allowedSortFields.includes(sortBy)
        ? sortBy
        : "createdAt";

    const sortOrder = ["asc", "az"].includes(order) ? "asc" : "desc";

    // ✅ Where clause
    const where: any = {
        deletedAt: null,
    };

    // ✅ Status filter
    if (status !== undefined) {
        where.status = status === "true" || status === true;
    }

    // ✅ Category filter
    if (categoryId) {
        where.categoryId = BigInt(categoryId);
    }

    // ✅ Brand filter
    if (brandId) {
        where.brandId = BigInt(brandId);
    }

    // ✅ Search (product + relations)
    if (search) {
        where.OR = [
            {
                name: {
                    contains: search,
                    mode: "insensitive",
                },
            },
            {
                brand: {
                    name: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
            },
            {
                category: {
                    name: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
            },
        ];
    }

    const [products, total] = await Promise.all([
        prisma.product.findMany({
            where,
            skip,
            take: limitNumber,

            include: {
                variants: true,
                brand: {
                    select: { name: true },
                },
                category: {
                    select: { name: true },
                },
            },

            orderBy: {
                [sortField]: sortOrder,
            },
        }),
        prisma.product.count({ where }),
    ]);

    return {
        data: products,
        meta: {
            total,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(total / limitNumber),
        },
    };
};

export const updateProduct = async (productId: bigint, data: UpdatePrductInput) => {
    return await prisma.$transaction(async (tx) => {

        const existingProduct = await tx.product.findUnique({
            where: {
                id: productId
            }
        })

        if (!existingProduct) {
            throw new Error("Product not found")
        }

        const product = await tx.product.update({
            where: {
                id: productId
            },
            data: {
                categoryId: data.categoryId,
                brandId: data.brandId,
                name: data.name,
                description: data.description
            }
        })

        let resultVariants = [];

        if (data.variants !== undefined) {
            const existingVariants = await tx.productVariant.findMany({
                where: {
                    productId
                }
            })

            const existingIds = existingVariants.map(v => v.id.toString())
            const incomingIds = data.variants
                .filter(v => v.id)
                .map(v => v.id!.toString())

            const toDelete = existingIds.filter(id => !incomingIds.includes(id))

            if (toDelete.length > 0) {
                await tx.productVariant.deleteMany({
                    where: {
                        id: { in: toDelete.map(id => BigInt(id)) }
                    }
                })
            }

            for (const variant of data.variants) {
                if (variant.id) {
                    const updated = await tx.productVariant.update({
                        where: { id: BigInt(variant.id) },
                        data: {
                            price: variant.price,
                            quantity: variant.quantity,
                            color: variant.color,
                            size: variant.size
                        }
                    })
                    resultVariants.push(updated)
                } else {
                    const created = await tx.productVariant.create({
                        data: {
                            productId,
                            price: variant.price,
                            quantity: variant.quantity,
                            color: variant.color,
                            size: variant.size,
                            sku: "TEMP"
                        }
                    })

                    const sku = `ECS${1000 + Number(created.id)}`

                    const updatedSku = await tx.productVariant.update({
                        where: {
                            id: created.id
                        },
                        data: {
                            sku
                        }
                    })

                    resultVariants.push(updatedSku)
                }
            }
        }
        const finalVariants = data.variants
            ? resultVariants
            : await tx.productVariant.findMany({ where: { productId } });

        return {
            ...product,
            variants: finalVariants
        };
    })
}

export const deleteProduct = async (productId: bigint) => {
    return await prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({
            where: {
                id: productId
            }
        })

        if (!product || product.deletedAt) {
            throw new Error("Product not found")
        }

        const now = new Date()

        await tx.productVariant.updateMany({
            where: {
                productId,
                deletedAt: null
            },
            data: {
                deletedAt: now
            }
        })

        const deleteProduct = await tx.product.update({
            where: {
                id: productId
            },
            data: {
                deletedAt: now
            }
        })

        return deleteProduct
    })
}