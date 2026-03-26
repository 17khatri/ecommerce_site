import prisma from "../../prisma/client.js";

export const createCategory = async (name: string, parentId?: string) => {
    return prisma.category.create({
        data: {
            name,
            parentId: parentId ? BigInt(parentId) : null,
        },
    });
};

export const getCategories = async () => {
    const categories = await prisma.category.findMany({
        where: { deletedAt: null, status: true },

    });

    const map = new Map<string, any>();

    categories.forEach(cat => {
        map.set(cat.id.toString(), {
            ...cat,
            id: cat.id.toString(),
            parentId: cat.parentId?.toString() || null,
            children: []
        });
    });

    const tree: any[] = [];

    map.forEach(cat => {
        if (cat.parentId) {
            map.get(cat.parentId)?.children.push(cat);
        } else {
            tree.push(cat);
        }
    });

    return tree;
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
    parentId?: string | null
) => {
    const categoryId = BigInt(id);

    // 1. Check category exists (and not deleted)
    const category = await prisma.category.findFirst({
        where: {
            id: categoryId,
            deletedAt: null
        }
    });

    if (!category) {
        throw new Error("Category not found");
    }

    // 2. Prevent self-parenting
    if (parentId && BigInt(parentId) === categoryId) {
        throw new Error("Category cannot be its own parent");
    }

    // 3. Prevent circular structure
    if (parentId) {
        const allChildren = await getAllChildCategoryIds(categoryId);

        if (allChildren.includes(BigInt(parentId))) {
            throw new Error("Cannot move category inside its own subtree");
        }
    }

    // 4. Validate parent exists
    if (parentId) {
        const parent = await prisma.category.findFirst({
            where: {
                id: BigInt(parentId),
                deletedAt: null
            }
        });

        if (!parent) {
            throw new Error("Parent category not found");
        }
    }

    // 5. Update
    const updated = await prisma.category.update({
        where: { id: categoryId },
        data: {
            ...(name && { name }),
            ...(parentId !== undefined && {
                parentId: parentId ? BigInt(parentId) : null
            })
        }
    });

    return updated;
};