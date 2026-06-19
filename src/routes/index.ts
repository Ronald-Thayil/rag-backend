import { Router } from "express";
import { API_PREFIX } from "@/shared/constants";
import { companyMiddleware } from "@/shared/middleware/company.middleware";

import healthRouter from "@/routes/health";
import companyRoutes from "@/modules/companies/routes/company.routes";
import userRoutes from "@/modules/users/routes/user.routes";
import authRoutes from "@/modules/auth/routes/auth.routes";

const router = Router();

router.use("/health", healthRouter);

const apiRouter = Router();
apiRouter.use("/companies", companyRoutes);
apiRouter.use("/users", companyMiddleware, userRoutes);
apiRouter.use("/auth", authRoutes);

router.use(API_PREFIX, apiRouter);

export default router;
