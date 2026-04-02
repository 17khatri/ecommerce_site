import prisma from "../../prisma/client.js";

export const createOrderService = async (data: any) => {
    const {
        userId,
        sessionId,
        paymentStatus,
        fullName,
        city,
        zipCode,
        state,
        address,
        paymentMethod,
        items
    } = data;

    if (!items || items.length === 0) {
        throw new Error("Order must have at least one item");
    }


    return await prisma.$transaction(async (tx) => {

        const cart = await tx.cart.findUnique({
            where: { userId: BigInt(userId) },
            include: { cartItems: true }
        });

        if (!cart) throw new Error("Cart not found");

        const cartMap = new Map(
            cart.cartItems.map(item => [
                item.variantId.toString(),
                item
            ])
        );

        for (const item of items) {
            const cartItem = cartMap.get(item.productVariantId.toString());

            if (!cartItem) {
                throw new Error("Item not found in cart");
            }

            if (cartItem.quantity < item.quantity) {
                throw new Error("Invalid quantity");
            }
        }

        let totalAmount = 0;
        const createdItems = [];

        // ✅ Step 1: Validate + calculate total
        for (const item of items) {
            const variant = await tx.productVariant.findFirst({
                where: {
                    id: BigInt(item.productVariantId),
                    productId: BigInt(item.productId),
                    deletedAt: null
                }
            });

            if (!variant) {
                throw new Error("Invalid product/variant");
            }

            if (variant.quantity < item.quantity) {
                throw new Error("Insufficient stock");
            }

            totalAmount += Number(variant.price) * item.quantity;

            createdItems.push({
                productId: BigInt(item.productId),
                productVariantId: BigInt(item.productVariantId),
                productPrice: variant.price,
                quantity: item.quantity
            });
        }

        // ✅ Step 2: Create Order
        const order = await tx.order.create({
            data: {
                userId: BigInt(userId),
                sessionId,
                totalAmount,
                paymentStatus,
                fullName,
                city,
                zipCode,
                state,
                address,
                paymentMethod
            }
        });

        // ✅ Step 3: Create OrderItems
        const orderItems = [];

        for (const item of createdItems) {
            const orderItem = await tx.orderItem.create({
                data: {
                    orderId: order.id,
                    productId: item.productId,
                    productVariantId: item.productVariantId,
                    productPrice: item.productPrice,
                    quantity: item.quantity
                }
            });

            // ✅ Optional: reduce stock
            await tx.productVariant.update({
                where: { id: item.productVariantId },
                data: {
                    quantity: {
                        decrement: item.quantity
                    }
                }
            });

            orderItems.push(orderItem);
        }

        return {
            ...order,
            orderItems
        };
    });
};