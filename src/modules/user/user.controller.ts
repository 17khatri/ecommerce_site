import { Request, Response } from "express";
import * as userService from "./user.service.js";
import { User } from "@prisma/client";
import { sendResetEmail } from "../../utils/sendEmail.js";
import { AuthRequest } from "../../middleware/auth.middleware.js";

export const createUserHandler = async (req: Request, res: Response) => {
    try {
        const { user, resetToken } = await userService.createUser(req.body);

        await sendResetEmail(user.email, resetToken)

        const { password, resetToken: rt, resetTokenExpiry, ...safeUser } = user;


        const result = { ...safeUser, id: user.id.toString() }

        res.status(201).json({
            message: "User created successfully",
            data: result,
        });
    } catch (error: any) {
        console.error(error);

        res.status(500).json({
            error: error.message || "Failed to create user",
        });
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

        res.json({
            message: "Password set successfully",
        });
    } catch (error: any) {
        res.status(400).json({
            error: error.message || "Failed to set password",
        });
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

        res.json({
            message: "Password change successfully"
        })
    } catch (error: any) {
        res.status(400).json({
            error: error.message || "Failed to change password"
        })
    }
}

export const getUserHandler = async (_req: Request, res: Response) => {
    try {
        const users = await userService.getUsers();


        const result = users.map((u: User) => {
            const { password, resetToken, resetTokenExpiry, ...safeUser } = u;

            return {
                ...safeUser,
                id: u.id.toString(),
            };
        });

        res.json({
            data: result,
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch users" });
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
        res.json({
            message: "Login Successful",
            data: {
                user: {
                    ...safeUser,
                    id: user.id.toString()
                },
                token
            }
        })
    } catch (error: any) {
        res.status(401).json({
            error: error.message || "Login failed"
        })
    }
}