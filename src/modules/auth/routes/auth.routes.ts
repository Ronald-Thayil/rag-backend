import { Router } from "express";
import { AuthController } from "@/modules/auth/controllers/auth.controller";
import { AuthService } from "@/modules/auth/services/auth.service";
import { UserRepository } from "@/modules/users/repositories/user.repository";
import { validateLogin } from "@/modules/auth/validators/auth.validator";

const router = Router();

const repository = new UserRepository();
const service = new AuthService(repository);
const controller = new AuthController(service);

router.post("/login", validateLogin, controller.login);

export default router;
