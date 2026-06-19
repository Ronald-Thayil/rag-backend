import { Router } from "express";
import { CompanyController } from "@/modules/companies/controllers/company.controller";
import { CompanyService } from "@/modules/companies/services/company.service";
import { CompanyRepository } from "@/modules/companies/repositories/company.repository";
import {
  validateCreateCompany,
  validateUpdateCompany,
} from "@/modules/companies/validators/company.validator";

const router = Router();

const repository = new CompanyRepository();
const service = new CompanyService(repository);
const controller = new CompanyController(service);

router.post("/", validateCreateCompany, controller.create);
router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.put("/:id", validateUpdateCompany, controller.update);
router.delete("/:id", controller.delete);

export default router;
