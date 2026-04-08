import prisma from "../../prisma/client.js";

export const createCategory = async (name: string, parentId?: string) => {

    const normalizedName = name.trim().toLowerCase();

    const existing = await prisma.category.findFirst({
        where: {
            name: normalizedName,
            deletedAt: null
        }
    });

    if (existing) {
        throw new Error("Category already exists");
    }

    return prisma.category.create({
        data: {
            name: normalizedName,
            parentId: parentId ? BigInt(parentId) : null,
        },
    });
};

export const getCategories = async (query: any) => {
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

    const where: any = {
        deletedAt: null,
    };

    if (status !== undefined) {
        where.status = status === "true" || status === true;
    }

    let categories;

    if (search) {
        const matchedCategories = await prisma.category.findMany({
            where: {
                name: {
                    contains: search,
                },
                deletedAt: null,
            },
            select: { id: true, parentId: true },
        });

        const ids = new Set<string>();

        matchedCategories.forEach(cat => {
            ids.add(cat.id.toString());
            if (cat.parentId) {
                ids.add(cat.parentId.toString());
            }
        });

        // ✅ Include children
        const childCategories = await prisma.category.findMany({
            where: {
                deletedAt: null,
                parentId: {
                    in: Array.from(ids).map(id => BigInt(id)),
                },
            },
            select: { id: true },
        });

        childCategories.forEach(child => {
            ids.add(child.id.toString());
        });

        categories = await prisma.category.findMany({
            where: {
                deletedAt: null,
                id: {
                    in: Array.from(ids).map(id => BigInt(id)),
                },
            },
            orderBy: {
                [sortBy]: order === "asc" ? "asc" : "desc",
            },
        });

    } else {
        categories = await prisma.category.findMany({
            where,
            skip,
            take: limitNumber,
            orderBy: {
                [sortBy]: order === "asc" ? "asc" : "desc",
            },
        });
    }

    const total = await prisma.category.count({ where });

    const map = new Map<string, any>();

    categories.forEach((cat) => {
        map.set(cat.id.toString(), {
            ...cat,
            id: cat.id.toString(),
            parentId: cat.parentId?.toString() || null,
            status: cat.status ? "active" : "inactive",
            children: [],
        });
    });

    const tree: any[] = [];

    map.forEach((cat) => {
        if (cat.parentId && map.has(cat.parentId)) {
            map.get(cat.parentId).children.push(cat);
        } else {
            tree.push(cat);
        }
    });

    return {
        data: tree,
        meta: {
            total,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(total / limitNumber),
        },
    };
};

const getAllChildCategoryIds = async (parentId: bigint): Promise<bigint[]> => {
    const children = await prisma.category.findMany({
        where: {
            parentId: parentId,
            deletedAt: null
        },
        select: { id: true }
    });

    let ids: bigint[] = [];

    for (const child of children) {
        ids.push(child.id);

        const subChildren = await getAllChildCategoryIds(child.id);
        ids = ids.concat(subChildren);
    }

    return ids;
};

export const deleteCategory = async (id: string) => {
    const categoryId = BigInt(id);
    const now = new Date();

    // 1. Check if category exists
    const category = await prisma.category.findFirst({
        where: { id: categoryId, deletedAt: null }
    });

    if (!category) {
        throw new Error("Category not found");
    }

    // 2. Get all descendant IDs
    const idsToDelete = await getAllChildCategoryIds(categoryId);

    // include parent also
    idsToDelete.push(categoryId);

    // 3. Soft delete all
    await prisma.category.updateMany({
        where: {
            id: { in: idsToDelete }
        },
        data: {
            deletedAt: now
        }
    });

    return { message: "Category and its children deleted successfully" };
};


export const updateCategory = async (
    id: string,
    name?: string,
    parentId?: string
) => {

    const existing = await prisma.category.findUnique({
        where: { id: BigInt(id) }
    });

    if (!existing) {
        throw new Error("Category not found");
    }

    // ❌ Prevent self-parenting
    if (parentId && id === parentId) {
        throw new Error("Category cannot be its own parent");
    }

    // ✅ Check parent exists
    if (parentId) {
        const parent = await prisma.category.findUnique({
            where: { id: BigInt(parentId) }
        });

        if (!parent) {
            throw new Error("Parent category not found");
        }
    }

    return prisma.category.update({
        where: { id: BigInt(id) },
        data: {
            ...(name && { name }),
            ...(parentId && { parentId: BigInt(parentId) })
        }
    });
};