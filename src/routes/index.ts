import { Router } from "express";
import { API_PREFIX } from "@/shared/constants";
import { companyMiddleware } from "@/shared/middleware/company.middleware";
import { authenticate, csrfProtection } from "@/shared/middleware/auth.middleware";
import { permissionAuditLogger } from "@/shared/middleware/rbac.middleware";

import healthRouter from "@/routes/health";
import companyRoutes from "@/modules/companies/routes/company.routes";
import userRoutes from "@/modules/users/routes/user.routes";
import authRoutes from "@/modules/auth/routes/auth.routes";
import storageRoutes from "@/api/storage/storage.routes";
import documentRoutes from "@/modules/rag/documents/routes/document.routes";

const router = Router();

router.use("/health", healthRouter);

const apiRouter = Router();

// Auth routes (no CSRF needed — uses cookie + rate limiting)
apiRouter.use("/auth", authRoutes);

// Storage routes (low-level file operations)
apiRouter.use("/storage", storageRoutes);

// Document routes (full upload pipeline with processing)
apiRouter.use("/documents", documentRoutes);



// Protected routes with RBAC audit logging
apiRouter.use("/companies", authenticate, permissionAuditLogger, csrfProtection, companyRoutes);
apiRouter.use("/users", authenticate, permissionAuditLogger, companyMiddleware, csrfProtection, userRoutes);

router.use(API_PREFIX, apiRouter);

export default router;
