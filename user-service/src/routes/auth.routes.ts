import express, { Router } from "express";
import { AuthController } from "../controller/auth.controller";
import { authenticateAdmin } from "../middleware/auth.middleware";

const router: Router = express.Router();

// Create an instance of AuthController
const authController = new AuthController();

router.post("/register", (req, res) => authController.register(req, res));
router.post("/login", (req, res) => authController.login(req, res));
router.post("/logout", (req, res) => authController.logout(req, res));
router.get("/verify-email/:token", (req, res) => authController.verifyEmail(req, res));

// Admin routes
router.post("/create-admin", authenticateAdmin, (req, res) => authController.createAdmin(req, res));
router.put("/make-admin/:userId", authenticateAdmin, (req, res) => authController.makeAdmin(req, res));
router.put("/remove-admin/:userId", authenticateAdmin, (req, res) => authController.removeAdmin(req, res));
router.post("/setup-admin", (req, res) => authController.setupAdmin(req, res));

export default router;