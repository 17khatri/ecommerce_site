import prisma from "../../prisma/client.js";

type VariantInput = {
    id?: string;
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
    const product = await prisma.product.create({
        data: {
            categoryId,
            brandId,
            name,
            description
        }
    })

    const createdVariants = [];

    for (const variant of variants) {
        const v = await prisma.productVariant.create({
            data: {
                productId: product.id,
                price: variant.price,
                quantity: variant.quantity,
                color: variant.color,
                size: variant.size,
                sku: "TEMP"
            }
        })

        const sku = `ECS${1000 + Number(v.id)}`

        const updatedVariant = await prisma.productVariant.update({
            where: { id: v.id },
            data: { sku }
        })

        createdVariants.push(updatedVariant)
    }
    return {
        ...product,
        variants: createdVariants
    }
}

export const getProducts = async () => {
    const products = await prisma.product.findMany({
        where: {
            deletedAt: null,
            status: true
        },

        include: {
            variants: true,
            brand: {
                select: {
                    name: true
                }
            },
            category: {
                select: {
                    name: true
                }
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    })

    return products
}

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
            const incomingIds = data.variants.filter(v => v.id).map(v => v.id as string)

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