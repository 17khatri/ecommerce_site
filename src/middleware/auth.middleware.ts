import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken"
import { JWT_SECRET } from "../config/env.js";

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: string;
    }
}

export const authUser = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHandler = req.headers.authorization
        if (!authHandler || !authHandler.startsWith("Bearer")) {
            return res.status(401).json({
                error: "Unauthorized: No token provided"
            })
        }
        const token = authHandler.split(" ")[1]

        const decoded = jwt.verify(token, JWT_SECRET) as {
            userId: string,
            email: string
            role: string
        }

        req.user = decoded

        next()
    } catch (error) {
        return res.status(401).json({
            error: "Unauthorize: Invalid token"
        })
    }
}