import { Router } from "express";
import { UserController } from "@/modules/users/controllers/user.controller";
import { UserService } from "@/modules/users/services/user.service";
import { UserRepository } from "@/modules/users/repositories/user.repository";
import {
  validateCreateUser,
  validateUpdateUser,
} from "@/modules/users/validators/user.validator";
import {
  requireRole,
  requirePermission,
  requireOwnUserAccess,
} from "@/shared/middleware/rbac.middleware";
import { UserRole } from "@/shared/enums";
import { Permissions } from "@/shared/constants/permissions";

const router = Router();

const repository = new UserRepository();
const service = new UserService(repository);
const controller = new UserController(service);

router.post(
  "/",
  requireRole(UserRole.ADMIN, UserRole.COMPANY_ADMIN),
  requirePermission(Permissions.USERS_CREATE),
  validateCreateUser,
  controller.create
);
router.get(
  "/",
  requireRole(UserRole.ADMIN, UserRole.COMPANY_ADMIN),
  requirePermission(Permissions.USERS_READ),
  controller.getAll
);
router.get(
  "/:id",
  requireRole(UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.MEMBER),
  requirePermission(Permissions.USERS_READ),
  requireOwnUserAccess,
  controller.getById
);
router.put(
  "/:id",
  requireRole(UserRole.ADMIN, UserRole.COMPANY_ADMIN),
  requirePermission(Permissions.USERS_UPDATE),
  requireOwnUserAccess,
  validateUpdateUser,
  controller.update
);
router.delete(
  "/:id",
  requireRole(UserRole.ADMIN, UserRole.COMPANY_ADMIN),
  requirePermission(Permissions.USERS_DELETE),
  requireOwnUserAccess,
  controller.delete
);

export default router;
