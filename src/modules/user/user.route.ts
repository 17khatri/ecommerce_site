import { Router } from "express"
import { changePasswordHandler, createUserHandler, getUserHandler, loginHandler, setPasswordHandler } from "./user.controller.js"
import { authUser } from "../../middleware/auth.middleware.js"
import { isAdmin } from "../../middleware/admin.middleware.js"

const router = Router()

router.post("/", createUserHandler)
router.get("/", authUser, isAdmin, getUserHandler)
router.post("/set-password", setPasswordHandler)
router.post("/change-password", authUser, changePasswordHandler)
router.post("/login", loginHandler)

export default router