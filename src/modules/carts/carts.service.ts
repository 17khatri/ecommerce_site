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

    // ✅ Check existing item (including soft deleted)
    const existingItem = await prisma.cartItem.findFirst({
        where: {
            cartId: cart.id,
            productId,
            variantId
        }
    });

    if (existingItem) {
        return await prisma.cartItem.update({
            where: { id: existingItem.id },
            data: {
                quantity: existingItem.deletedAt
                    ? quantity // reset if deleted
                    : { increment: quantity },
                deletedAt: null // restore if deleted
            }
        });
    }

    // ✅ If not exists → create new
    return await prisma.cartItem.create({
        data: {
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

export const updateCartItem = async (
    userId: string,
    productId: string,
    variantId: string,
    quantity: number
) => {

    const cart = await prisma.cart.findUnique({
        where: { userId: BigInt(userId) }
    });

    if (!cart) {
        throw new Error("Cart not found");
    }

    const variant = await prisma.productVariant.findFirst({
        where: {
            id: BigInt(variantId),
            productId: BigInt(productId),
            deletedAt: null
        }
    });

    if (!variant) {
        throw new Error("Invalid product/variant");
    }

    const existingItem = await prisma.cartItem.findFirst({
        where: {
            cartId: cart.id,
            productId: BigInt(productId),
            variantId: BigInt(variantId)
        }
    });

    // ❌ quantity = 0 → soft delete
    if (quantity === 0) {
        if (!existingItem) {
            throw new Error("Item not found");
        }

        return await prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { deletedAt: new Date() }
        });
    }

    // ✅ Validate stock
    if (variant.quantity < quantity) {
        throw new Error("Not enough stock");
    }

    // ✅ If item exists → update or restore
    if (existingItem) {
        return await prisma.cartItem.update({
            where: { id: existingItem.id },
            data: {
                quantity,
                deletedAt: null // restore if needed
            }
        });
    }

    // ✅ If not exists → create
    return await prisma.cartItem.create({
        data: {
            cartId: cart.id,
            productId: BigInt(productId),
            variantId: BigInt(variantId),
            quantity
        }
    });
};


export const deleteCartItem = async (userId: string, productId: string, variantId: string) => {
    const now = new Date()
    const cart = await prisma.cart.findUnique({
        where: {
            userId: BigInt(userId)
        }
    })

    if (!cart) {
        throw new Error("Cart not found")
    }

    const cartItems = await prisma.cartItem.findMany({
        where: {
            cart: {
                userId: BigInt(userId)
            }
        }
    })

    console.log(cartItems)

    const cartItem = await prisma.cartItem.findFirst({
        where: {
            cart: {
                userId: BigInt(userId)
            },
            productId: BigInt(productId),
            variantId: BigInt(variantId),
            deletedAt: null
        }
    })

    if (!cartItem) {
        throw new Error("Cart item not found")
    }


    return await prisma.cartItem.update({
        where: {
            cartId_productId_variantId: {
                cartId: cart.id,
                productId: BigInt(productId),
                variantId: BigInt(variantId)
            }
        },
        data: {
            deletedAt: new Date()
        }
    });
}