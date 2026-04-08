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
        items,
        couponCode
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
                },
                include: {
                    product: {
                        select: {
                            brandId: true,
                        }
                    }
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
                productPrice: variant.price.toNumber(),
                quantity: item.quantity,
                brandId: Number(variant.product.brandId) || null,
                discountedPrice: 0,
                isCouponApplied: false,
                discountAmount: 0
            });
        }

        let discountAmount = 0;
        let appliedCouponId: bigint | null = null;
        if (couponCode) {
            const normalizedCode = couponCode.trim().toUpperCase();

            const coupon = await tx.coupon.findFirst({
                where: {
                    code: normalizedCode,
                    deletedAt: null,
                    status: true
                }
            });

            if (!coupon) {
                throw new Error("Invalid coupon code");
            }

            const couponBrandId = coupon.brandId ? Number(coupon.brandId) : null;

            const now = new Date();

            let eligibleAmount = totalAmount;

            if (couponBrandId) {
                const eligibleItems = createdItems.filter(
                    (item) => item.brandId === Number(coupon.brandId)
                );

                if (eligibleItems.length === 0) {
                    throw new Error("Coupon not applicable for selected products");
                }

                eligibleAmount = eligibleItems.reduce(
                    (sum, item) =>
                        sum + Number(item.productPrice) * item.quantity,
                    0
                );
            }

            // ✅ Check validity dates
            if (now < coupon.startDate || now > coupon.endDate) {
                throw new Error("Coupon expired or not active");
            }

            // ✅ Check usage limit
            if (coupon.usedCount >= coupon.maxUsage) {
                throw new Error("Coupon usage limit reached");
            }

            // ✅ Check minimum order amount
            if (eligibleAmount < coupon.minOrderAmount) {
                throw new Error(`Minimum order amount should be ${coupon.minOrderAmount}`);
            }

            // ✅ Calculate discount
            if (coupon.couponType === "PERCENTAGE") {
                discountAmount =
                    (eligibleAmount * (coupon.discountPercentage || 0)) / 100;

                if (coupon.maxDiscountPrice) {
                    discountAmount = Math.min(
                        discountAmount,
                        coupon.maxDiscountPrice
                    );
                }
            } else if (coupon.couponType === "FIXED") {
                discountAmount = coupon.fixedAmount || 0;

                // safety
                discountAmount = Math.min(discountAmount, eligibleAmount);
            }

            appliedCouponId = coupon.id;
        }

        const finalAmount = totalAmount - discountAmount;

        if (discountAmount > 0) {
            let eligibleItems = createdItems;

            // If coupon is brand-specific
            if (appliedCouponId) {
                const coupon = await tx.coupon.findUnique({
                    where: { id: appliedCouponId }
                });

                if (coupon?.brandId) {
                    eligibleItems = createdItems.filter(
                        (item) => item.brandId === Number(coupon.brandId)
                    );
                }
            }

            const eligibleTotal = eligibleItems.reduce(
                (sum, item) => sum + Number(item.productPrice) * item.quantity,
                0
            );

            for (const item of createdItems) {
                const itemTotal = Number(item.productPrice) * item.quantity;

                if (!eligibleItems.includes(item)) {
                    item.discountedPrice = item.productPrice;
                    item.isCouponApplied = false;
                    item.discountAmount = 0;
                    continue;
                }

                const itemDiscount =
                    (itemTotal / eligibleTotal) * discountAmount;

                const perUnitDiscount = itemDiscount / item.quantity;

                item.discountedPrice =
                    Number(item.productPrice) - perUnitDiscount;

                item.isCouponApplied = true;
                item.discountAmount = perUnitDiscount;
            }
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
                paymentMethod,
                couponId: appliedCouponId,
                discountAmount,
                finalAmount
            }
        });

        if (appliedCouponId) {
            const updatedCoupon = await tx.coupon.update({
                where: { id: appliedCouponId },
                data: {
                    usedCount: {
                        increment: 1
                    }
                }
            });

            if (updatedCoupon.usedCount >= updatedCoupon.maxUsage) {
                await tx.coupon.update({
                    where: { id: appliedCouponId },
                    data: { status: false }
                });
            }
        }

        // ✅ Step 3: Create OrderItems
        const orderItems = [];

        for (const item of createdItems) {
            const orderItem = await tx.orderItem.create({
                data: {
                    orderId: order.id,
                    productId: item.productId,
                    productVariantId: item.productVariantId,
                    productPrice: item.productPrice,
                    quantity: item.quantity,
                    discountedPrice: item.discountedPrice,
                    is_coupon_applied: item.isCouponApplied,
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

        // ✅ Step 4: Update Cart (IMPORTANT FIX)
        for (const item of createdItems) {
            const cartItem = cartMap.get(item.productVariantId.toString());

            if (!cartItem) continue;

            const remainingQty = cartItem.quantity - item.quantity;

            if (remainingQty > 0) {
                await tx.cartItem.update({
                    where: { id: cartItem.id },
                    data: {
                        quantity: remainingQty
                    }
                });
            } else {
                await tx.cartItem.update({
                    where: { id: cartItem.id },
                    data: {
                        deletedAt: new Date()
                    }
                });
            }
        }

        return {
            ...order,
            orderItems
        };
    });
};


export const getUserOrdersService = async (userId: string) => {
    const orders = await prisma.order.findMany({
        where: { userId: BigInt(userId) },
        orderBy: { createdAt: "desc" },
        include: {
            orderItems: {
                include: {
                    productVariant: true,
                    product: true
                }
            },
            coupon: true
        }
    })
    return orders;
}