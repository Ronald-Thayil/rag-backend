import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { errorResponse } from "@/shared/utils/response";

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export function validateLogin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { error, value } = loginSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map((d) => d.message);
    errorResponse(res, "Validation failed", 400, messages);
    return;
  }
  req.body = value;
  next();
}
