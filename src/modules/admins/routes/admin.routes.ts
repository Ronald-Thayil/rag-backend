import { Router } from "express";
import { AdminController } from "@/modules/admins/controllers/admin.controller";
import { AdminService } from "@/modules/admins/services/admin.service";
import { AdminRepository } from "@/modules/admins/repositories/admin.repository";
import { validateCreateAdmin, validateCreateCompanyAdmin } from "@/modules/admins/validators/admin.validator";
import { requireRole } from "@/shared/middleware/rbac.middleware";
import { UserRole } from "@/shared/enums";

const router = Router();

const repository = new AdminRepository();
const service = new AdminService(repository);
const controller = new AdminController(service);

router.post("/", requireRole(UserRole.ADMIN), validateCreateAdmin, controller.create);

// create company admin

router.post("/company-admin", requireRole(UserRole.ADMIN), validateCreateCompanyAdmin, controller.createCompanyAdmin);

export default router;
