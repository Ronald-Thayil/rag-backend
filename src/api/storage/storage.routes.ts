import { Router } from "express";
import { StorageController } from "@/api/storage/storage.controller";
import upload from "@/middleware/file-upload";
import { authenticate } from "@/shared/middleware/auth.middleware";

const router = Router();
const controller = new StorageController();

router.get("/health", controller.healthCheck);

router.post("/upload", authenticate, upload.single("file"), controller.upload);
router.get("/download/:key(*)", authenticate, controller.download);
router.get("/signed-url/:key(*)", authenticate, controller.getSignedUrl);
router.delete("/:key(*)", authenticate, controller.delete);

export default router;
