import { Request, Response, NextFunction } from "express";
import { AppError } from "@/shared/errors/app-error";
import { logger } from "@/config/logger";

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError && err.isOperational) {
    logger.warn(`${err.statusCode} - ${err.message}`);
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      data: null,
    });
    return;
  }

  logger.error("Unhandled error", { error: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    data: null,
  });
}
