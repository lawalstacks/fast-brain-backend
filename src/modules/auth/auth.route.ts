import { Router } from "express";
import { authController } from "./auth.module";
import { authenticateJWT } from "../../common/strategies/jwt.strategy";
import { getAuthRateLimiter } from "../../config/rate-limiter.config";

const authRoutes = Router();

// Call getAuthRateLimiter() directly in the route - it will be executed when the route is hit
authRoutes.post("/register", getAuthRateLimiter(), authController.register);
authRoutes.post("/login", getAuthRateLimiter(), authController.login);
authRoutes.post("/verify-email", getAuthRateLimiter(), authController.verifyEmail);
authRoutes.post("/forgot-password", getAuthRateLimiter(), authController.forgotPassword);
authRoutes.post("/reset-password", getAuthRateLimiter(), authController.resetPassword);
authRoutes.post("/logout", authenticateJWT, authController.logout);

authRoutes.get("/refresh-token", authController.refreshToken);

export default authRoutes;