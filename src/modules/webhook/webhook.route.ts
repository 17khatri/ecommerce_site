import express from "express";
import { handleWebhook } from "./webhook.controller.js";

const router = express.Router();

// ⚠️ RAW body needed for Stripe
router.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    handleWebhook
);

export default router;