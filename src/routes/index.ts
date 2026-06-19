import { Router } from "express";
import { API_PREFIX } from "@/shared/constants";
import { tenantMiddleware } from "@/shared/middleware/tenant.middleware";

import healthRouter from "@/routes/health";
import tenantRoutes from "@/modules/tenants/routes/tenant.routes";
import userRoutes from "@/modules/users/routes/user.routes";
import authRoutes from "@/modules/auth/routes/auth.routes";

const router = Router();

router.use("/health", healthRouter);

const apiRouter = Router();
apiRouter.use("/tenants", tenantRoutes);
apiRouter.use("/users", tenantMiddleware, userRoutes);
apiRouter.use("/auth", authRoutes);

router.use(API_PREFIX, apiRouter);

export default router;
