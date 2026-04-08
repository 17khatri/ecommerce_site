import express from "express";
import { createOrderHandler, getUserOrdersHandler } from "./order.controller.js";
import { authUser } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authUser, createOrderHandler);
router.get("/", authUser, getUserOrdersHandler);

export default router;