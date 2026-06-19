import { Router } from "express";
import sequelize from "@/db";
import { logger } from "@/config/logger";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    logger.error("DB connection failed", err as Error);
    res.status(503).json({ status: "error", db: "disconnected" });
  }
});

export default router;
