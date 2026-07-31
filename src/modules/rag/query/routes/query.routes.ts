import { Router } from "express";
import { QueryController } from "@/modules/rag/query/controllers/query.controller";
import { validateQuery } from "@/modules/rag/query/validators/query.validator";
import { authenticate } from "@/shared/middleware/auth.middleware";
import { companyMiddleware } from "@/shared/middleware/company.middleware";
import { requireRole } from "@/shared/middleware/rbac.middleware";
import { UserRole } from "@/shared/enums";

const router = Router();
const controller = new QueryController();

router.post(
  "/",
  authenticate,
  companyMiddleware,
  validateQuery,
  controller.query
);
//api for list all audit logs
router.get(
  "/audit-logs",
  authenticate,
  companyMiddleware,
  controller.listAuditLogs
);

// Company admin: Get company query statistics with pagination
router.get(
  "/stats",
  authenticate,
  companyMiddleware,
  requireRole(UserRole.COMPANY_ADMIN),
  controller.getCompanyQueryStats
);

export default router;
