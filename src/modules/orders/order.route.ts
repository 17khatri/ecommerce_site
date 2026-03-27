import express from "express";
import { createOrderHandler } from "./order.controller.js";
import { authUser } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authUser, createOrderHandler);

export default router;