import { Router } from "express";
import { QueryController } from "@/modules/rag/query/controllers/query.controller";
import { validateQuery } from "@/modules/rag/query/validators/query.validator";
import { authenticate } from "@/shared/middleware/auth.middleware";
import { companyMiddleware } from "@/shared/middleware/company.middleware";

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

export default router;
