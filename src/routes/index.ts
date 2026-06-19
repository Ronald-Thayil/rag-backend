import { Router } from "express";
import { API_PREFIX } from "@/shared/constants";
import { companyMiddleware } from "@/shared/middleware/company.middleware";
import { authenticate, csrfProtection } from "@/shared/middleware/auth.middleware";

import healthRouter from "@/routes/health";
import companyRoutes from "@/modules/companies/routes/company.routes";
import userRoutes from "@/modules/users/routes/user.routes";
import authRoutes from "@/modules/auth/routes/auth.routes";

const router = Router();

router.use("/health", healthRouter);

const apiRouter = Router();

// Auth routes (no CSRF needed — uses cookie + rate limiting)
apiRouter.use("/auth", authRoutes);

// Protected routes
apiRouter.use("/companies", authenticate, csrfProtection, companyRoutes);
apiRouter.use("/users", authenticate, companyMiddleware, csrfProtection, userRoutes);

router.use(API_PREFIX, apiRouter);

export default router;
