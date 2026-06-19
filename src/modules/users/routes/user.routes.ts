import { Router } from "express";
import { UserController } from "@/modules/users/controllers/user.controller";
import { UserService } from "@/modules/users/services/user.service";
import { UserRepository } from "@/modules/users/repositories/user.repository";
import {
  validateCreateUser,
  validateUpdateUser,
} from "@/modules/users/validators/user.validator";

const router = Router();

const repository = new UserRepository();
const service = new UserService(repository);
const controller = new UserController(service);

router.post("/", validateCreateUser, controller.create);
router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.put("/:id", validateUpdateUser, controller.update);
router.delete("/:id", controller.delete);

export default router;
