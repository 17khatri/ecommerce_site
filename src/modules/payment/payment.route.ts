import express from "express";
import { createCheckoutSession, getSessionDetails } from "./payment.controller.js";
import { authUser } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.post("/create-checkout-session", authUser, createCheckoutSession);
router.get("/session", getSessionDetails);

export default router;