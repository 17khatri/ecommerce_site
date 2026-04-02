import prisma from "../../prisma/client.js";
import crypto from "crypto"
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"
import { JWT_SECRET, JWT_EXPIRES_IN } from "../../config/env.js";

type CreateUserInput = {
    firstName: string;
    middleName?: string;
    lastName: string;
    gender: string;
    birthDate: string;
    email: string;
    phoneNumber: string;
};

export const createUser = async (data: CreateUserInput) => {
    const resetToken = crypto.randomBytes(32).toString("hex")

    const resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 60)

    const existingUser = await prisma.user.findUnique({
        where: {
            email: data.email
        }
    })

    if (existingUser) {
        throw new Error("Email already exist")
    }

    const user = await prisma.user.create({
        data: {
            firstName: data.firstName,
            middleName: data.middleName,
            lastName: data.lastName,
            gender: data.gender,
            birthDate: new Date(data.birthDate),
            email: data.email,
            phoneNumber: data.phoneNumber,
            password: null,
            resetToken,
            resetTokenExpiry
        },
    });

    return { user, resetToken }
};

export const setPassword = async (token: string, newPassword: string) => {
    const user = await prisma.user.findFirst({
        where: {
            resetToken: token,
            resetTokenExpiry: {
                gte: new Date(),
            },
        },
    });

    if (!user) {
        throw new Error("Invalid or expired token");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    return prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiry: null,
        },
    });
};

export const changePassword = async (userId: string, currentPassword: string, newPassword: string) => {

    const user = await prisma.user.findUnique({
        where: {
            id: BigInt(userId)
        }
    })

    if (!user || !user.password) {
        throw new Error("User not found")
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password)

    if (!isMatch) {
        throw new Error("Current password is not correct")
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword
        }
    })

}

export const getUsers = async (query: any) => {
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

    const allowedSortFields = ["firstName", "lastName", "email", "createdAt"];
    const sortField = allowedSortFields.includes(sortBy)
        ? sortBy
        : "createdAt";

    // ✅ Support multiple order formats
    let sortOrder: "asc" | "desc" = "desc";

    if (["asc", "az"].includes(order)) {
        sortOrder = "asc";   // A → Z
    } else if (["desc", "za"].includes(order)) {
        sortOrder = "desc";  // Z → A
    }

    const where: any = {
        deletedAt: null,
    };

    if (search) {
        where.OR = [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { email: { contains: search } },
        ];
    }

    if (status !== undefined) {
        where.status = status === "true" || status === true;
    }

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            skip,
            take: limitNumber,
            orderBy: {
                [sortField]: sortOrder,
            },
        }),
        prisma.user.count({ where }),
    ]);

    return {
        data: users,
        meta: {
            total,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(total / limitNumber),
        },
    };
};

export const loginUser = async (email: string, password: string) => {
    const user = await prisma.user.findFirst({
        where: {
            email,
            deletedAt: null,
            status: true
        }
    })

    if (!user || !user.password) {
        throw new Error("Invalid email password")
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        throw new Error("Invalid email password")
    }

    const token = jwt.sign(
        { userId: user.id.toString(), email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
    return { user, token }
}