import { NextFunction, Response } from "express";
import { AuthRequest } from "./auth.middleware.js";

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const user = req.user

        if (!user) {
            return res.status(401).json({
                error: "Unauthorized"
            })
        }

        if (user.role !== "ADMIN") {
            return res.status(403).json({ error: "Admin access only" })
        }

        next()
    } catch (error) {
        return res.status(500).json({
            error: "Something went wrong"
        })
    }
}