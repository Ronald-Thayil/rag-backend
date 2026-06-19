import { Router } from "express";
import rateLimit from "express-rate-limit";
import { AuthController } from "@/modules/auth/controllers/auth.controller";
import { AuthService } from "@/modules/auth/services/auth.service";
import { AuthRepository } from "@/modules/auth/repositories/auth.repository";
import { UserRepository } from "@/modules/users/repositories/user.repository";
import { validateLogin } from "@/modules/auth/validators/auth.validator";

const router = Router();

const authRepository = new AuthRepository();
const userRepository = new UserRepository();
const service = new AuthService(authRepository, userRepository);
const controller = new AuthController(service);

// Rate limit: 10 login attempts per 15 min per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts. Try again later.", data: null },
});

router.post("/login/user", loginLimiter, validateLogin, controller.loginUser);
router.post("/login/admin", loginLimiter, validateLogin, controller.loginAdmin);
router.post("/refresh", controller.refresh);
router.post("/logout", controller.logout);

export default router;
