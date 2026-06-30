import { Router } from "express";
import { DocumentController } from "@/modules/rag/documents/controllers/document.controller";
import { validateUploadMetadata } from "@/modules/rag/documents/validators/document.validator";
import upload from "@/middleware/file-upload";
import { authenticate } from "@/shared/middleware/auth.middleware";
import { companyMiddleware } from "@/shared/middleware/company.middleware";

const router = Router();
const controller = new DocumentController();

router.post(
  "/upload",
  authenticate,
  companyMiddleware,
  upload.single("file"),
  validateUploadMetadata,
  controller.upload
);

router.get(
  "/",
  authenticate,
  companyMiddleware,
  controller.list
);

router.get(
  "/:id/status",
  authenticate,
  controller.getStatus
);

router.get(
  "/:id",
  authenticate,
  controller.getById
);

router.get(
  "/:id/chunks",
  authenticate,
  controller.getChunks
);

export default router;
