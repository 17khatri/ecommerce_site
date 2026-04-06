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

            const now = new Date();

            // ✅ Check validity dates
            if (now < coupon.startDate || now > coupon.endDate) {
                throw new Error("Coupon expired or not active");
            }

            // ✅ Check usage limit
            if (coupon.usedCount >= coupon.maxUsage) {
                throw new Error("Coupon usage limit reached");
            }

            // ✅ Check minimum order amount
            if (totalAmount < coupon.minOrderAmount) {
                throw new Error(`Minimum order amount should be ${coupon.minOrderAmount}`);
            }

            // ✅ Calculate discount
            if (coupon.couponType === "PERCENTAGE") {
                discountAmount = (totalAmount * (coupon.discountPercentage || 0)) / 100;

                // Apply max discount cap
                if (coupon.maxDiscountPrice) {
                    discountAmount = Math.min(discountAmount, coupon.maxDiscountPrice);
                }
            } else if (coupon.couponType === "FIXED") {
                discountAmount = coupon.fixedAmount || 0;
            }

            appliedCouponId = coupon.id;
        }

        const finalAmount = totalAmount - discountAmount;

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