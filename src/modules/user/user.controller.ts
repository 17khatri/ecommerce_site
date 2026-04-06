import { Request, Response } from "express";
import * as userService from "./user.service.js";
import { User } from "@prisma/client";
import { sendResetEmail } from "../../utils/sendEmail.js";
import { AuthRequest } from "../../middleware/auth.middleware.js";
import { serializeBigInt } from "../../utils/serialize.js";
import { createUserSchema } from "./user.validation.js";
import { ZodError } from "zod";
import { errorResponse, successResponse } from "../../utils/response.js";
import { formatZodError } from "../../utils/zodError.js";

export const createUserHandler = async (req: Request, res: Response) => {
    try {
        const validatedData = createUserSchema.parse(req.body);
        const { user, resetToken } = await userService.createUser(validatedData);

        await sendResetEmail(user.email, resetToken)

        const { password, resetToken: rt, resetTokenExpiry, ...safeUser } = user;


        const result = { ...safeUser, id: user.id.toString() }

        return successResponse(res, "User created successfully", result, null, 201)
    } catch (error: any) {
        console.error(error);

        if (error instanceof ZodError) {
            return res.status(400).json({
                status: false,
                message: "Validation failed",
                error: formatZodError(error)
            });
        }
        return errorResponse(res, "Failed to create user", error.message || "Failed to create user", 500)
    }
};

export const setPasswordHandler = async (req: Request, res: Response) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({
                error: "Token and password are required",
            });
        }

        if (password.length < 6) {
            throw new Error("Password must be at least 6 characters");
        }

        await userService.setPassword(token, password);

        return successResponse(res, "Password set successfully")
    } catch (error: any) {
        return errorResponse(res, "Failed to set password", error.message || "Failed to set password", 400)
    }
};

export const changePasswordHandler = async (req: AuthRequest, res: Response) => {

    try {
        const user = req.user;
        const { currentPassword, newPassword } = req.body

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                error: "currentPassword and newPassword is required"
            })
        }


        await userService.changePassword(user?.userId, currentPassword, newPassword)

        return successResponse(res, "Password changed successfully")
    } catch (error: any) {
        return errorResponse(res, "Failed to change password", error.message || "Failed to change password", 400)
    }
}

export const getUserHandler = async (req: Request, res: Response) => {
    try {
        const users = await userService.getUsers(req.query);


        const result = users.data.map((u: User) => {
            const { password, resetToken, resetTokenExpiry, ...safeUser } = u;

            return safeUser;
        });

        return successResponse(res, "Users fetched successfully", serializeBigInt(result), users.meta)
    } catch (error: any) {
        return errorResponse(res, "Failed to fetch users", error.message || "Failed to fetch users", 500)
    }
};

export const loginHandler = async (req: Request, res: Response) => {

    try {
        const { email, password } = await req.body

        if (!email || !password) {
            return res.status(400).json({
                error: "Email and password is required"
            })
        }

        const { user, token } = await userService.loginUser(email, password)

        const { password: pwd, resetToken, resetTokenExpiry, ...safeUser } = user

        const result = {
            user: safeUser,
            token
        }

        return successResponse(res, "Login successful", serializeBigInt(result))
    } catch (error: any) {
        return errorResponse(res, "Failed to login", error.message || "Failed to login", 400)
    }
}