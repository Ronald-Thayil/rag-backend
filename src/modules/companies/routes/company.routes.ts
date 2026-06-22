import { Router } from "express";
import { CompanyController } from "@/modules/companies/controllers/company.controller";
import { CompanyService } from "@/modules/companies/services/company.service";
import { CompanyRepository } from "@/modules/companies/repositories/company.repository";
import {
  validateCreateCompany,
  validateUpdateCompany,
} from "@/modules/companies/validators/company.validator";
import { requireRole } from "@/shared/middleware/rbac.middleware";
import { UserRole } from "@/shared/enums";

const router = Router();

const repository = new CompanyRepository();
const service = new CompanyService(repository);
const controller = new CompanyController(service);

router.post("/", requireRole(UserRole.ADMIN), validateCreateCompany, controller.create);
router.get("/", requireRole(UserRole.ADMIN), controller.getAll);
router.get("/:id", requireRole(UserRole.ADMIN), controller.getById);
router.put("/:id", requireRole(UserRole.ADMIN), validateUpdateCompany, controller.update);
router.delete("/:id", requireRole(UserRole.ADMIN), controller.delete);

export default router;
