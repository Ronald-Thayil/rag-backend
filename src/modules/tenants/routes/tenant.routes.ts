import { Router } from "express";
import { TenantController } from "@/modules/tenants/controllers/tenant.controller";
import { TenantService } from "@/modules/tenants/services/tenant.service";
import { TenantRepository } from "@/modules/tenants/repositories/tenant.repository";
import {
  validateCreateTenant,
  validateUpdateTenant,
} from "@/modules/tenants/validators/tenant.validator";

const router = Router();

const repository = new TenantRepository();
const service = new TenantService(repository);
const controller = new TenantController(service);

router.post("/", validateCreateTenant, controller.create);
router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.put("/:id", validateUpdateTenant, controller.update);
router.delete("/:id", controller.delete);

export default router;
