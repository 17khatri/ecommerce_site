import prisma from "../../prisma/client.js";

export const addToCart = async (
    userId: string,
    productId: bigint,
    variantId: bigint,
    quantity: number
) => {

    // ✅ Validate product + variant relation
    const variant = await prisma.productVariant.findFirst({
        where: {
            id: variantId,
            deletedAt: null,
            productId: productId
        }
    });

    if (!variant) {
        throw new Error("Invalid product and variant combination");
    }

    if (variant.quantity < quantity) {
        throw new Error("Not enough stock available")
    }

    // ✅ Find or create cart
    let cart = await prisma.cart.findUnique({
        where: { userId: BigInt(userId) }
    });

    if (!cart) {
        cart = await prisma.cart.create({
            data: { userId: BigInt(userId) }
        });
    }

    // ✅ Upsert cart item
    return await prisma.cartItem.upsert({
        where: {
            cartId_productId_variantId: {
                cartId: cart.id,
                productId,
                variantId
            }
        },
        update: {
            quantity: {
                increment: quantity
            }
        },
        create: {
            cartId: cart.id,
            productId,
            variantId,
            quantity
        }
    });
};


export const getCart = async (userId: string) => {

    const cart = await prisma.cart.findUnique({
        where: {
            userId: BigInt(userId),
        },
        include: {
            cartItems: {
                where: {
                    deletedAt: null
                },
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            status: true,
                            deletedAt: true,
                            images: {
                                where: { isPrimary: true },
                                select: { imagePath: true }
                            }
                        }
                    },
                    variant: {
                        select: {
                            id: true,
                            price: true,
                            quantity: true,
                            color: true,
                            size: true
                        }
                    }
                }
            }
        }
    });

    if (!cart) {
        return { items: [], totalAmount: 0 };
    }

    // ✅ Filter invalid products (deleted/inactive)
    const validItems = cart.cartItems.filter(item =>
        item.product &&
        item.product.status === true &&
        item.product.deletedAt === null &&
        item.variant.quantity > 0
    );

    // ✅ Calculate total
    let totalAmount = 0;

    const items = validItems.map(item => {
        const price = Number(item.variant.price);
        const qty = item.quantity;

        const itemTotal = price * qty;
        totalAmount += itemTotal;

        return {
            id: item.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: qty,
            price,
            total: itemTotal,
            product: {
                name: item.product.name,
                image: item.product.images[0]?.imagePath || null
            },
            variant: {
                color: item.variant.color,
                size: item.variant.size
            }
        };
    });

    return {
        items,
        totalAmount
    };
};