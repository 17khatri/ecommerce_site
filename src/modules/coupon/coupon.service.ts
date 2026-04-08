import prisma from "../../prisma/client.js";

export const createCoupon = async (data: any) => {
    const normalizedCode = data.code.trim().toUpperCase();

    const existing = await prisma.coupon.findFirst({
        where: {
            code: normalizedCode,
        }
    })

    if (existing) {
        if (existing.deletedAt) {
            return prisma.coupon.update({
                where: {
                    id: existing.id
                },
                data: {
                    deletedAt: null,
                    ...data,
                    code: normalizedCode
                }
            })
        }
        throw new Error("Coupon code already exists")
    }

    if (data.brand_id) {
        const brand = await prisma.brand.findUnique({
            where: {
                id: data.brand_id
            }
        })

        if (!brand) {
            throw new Error("Brand not found")
        }
    }

    return prisma.coupon.create({
        data: {
            name: data.name,
            code: normalizedCode,
            couponType: data.coupon_type,
            brandId: data.brand_id ?? null,
            discountPercentage: data.discount_percentage ?? null,
            fixedAmount: data.fixed_amount ?? null,
            minOrderAmount: data.min_order_amount,
            maxDiscountPrice: data.max_discount_price ?? null,
            maxUsage: data.max_usage,
            usedCount: data.used_count ?? 0,
            startDate: data.start_date,
            endDate: data.end_date,
        }
    })

}

export const getCoupons = async () => {
    const coupons = await prisma.coupon.findMany({
        where: {
            deletedAt: null
        }
    })

    const transformedCoupons = coupons.map(coupon => ({
        ...coupon,
        id: coupon.id.toString(),
        status: coupon.status ? "active" : "inactive"
    }))
    return {
        data: transformedCoupons
    };
}

export const updateCoupon = async (id: string, data: any) => {
    const couponId = BigInt(id)

    const existing = await prisma.coupon.findUnique({
        where: {
            id: couponId
        }
    })

    if (!existing) {
        throw new Error("Coupon not found")
    }

    if (data.code) {
        const duplicate = await prisma.coupon.findFirst({
            where: {
                code: data.code.trim().toUpperCase(),
                NOT: {
                    id: couponId
                }
            }
        })
        if (duplicate) {
            throw new Error("Coupon code already exists")
        }
    }

    if (data.brand_id) {
        const brand = await prisma.brand.findFirst({
            where: {
                id: data.brand_id,
                deletedAt: null
            }
        })
        if (!brand) {
            throw new Error("Brand not found")
        }
    }

    return prisma.coupon.update({
        where: { id: couponId },
        data: {
            name: data.name,
            code: data.code ? data.code.trim().toUpperCase() : undefined,
            couponType: data.coupon_type,
            brandId: data.brand_id,
            discountPercentage: data.discount_percentage,
            fixedAmount: data.fixed_amount,
            minOrderAmount: data.min_order_amount,
            maxDiscountPrice: data.max_discount_price,
            maxUsage: data.max_usage,
            startDate: data.start_date,
            endDate: data.end_date,
        }
    })
}
