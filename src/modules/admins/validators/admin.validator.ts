import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { errorResponse } from "@/shared/utils/response";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const createAdminSchema = Joi.object({
  email: Joi.string().pattern(emailPattern).required().messages({
    "string.pattern.base": "Invalid email format",
  }),
  password: Joi.string().min(8).required().messages({
    "string.min": "Password must be at least 8 characters",
  }),
  first_name: Joi.string().optional().allow("", null),
  last_name: Joi.string().optional().allow("", null),
  is_active: Joi.boolean().optional(),
});

export function validateCreateAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { error, value } = createAdminSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    const messages = error.details.map((d) => d.message);
    errorResponse(res, "Validation failed", 400, messages);
    return;
  }
  req.body = value;
  next();
}

export const createCompanyAdminSchema = Joi.object({
  email: Joi.string().pattern(emailPattern).required().messages({
    "string.pattern.base": "Invalid email format",
  }),
  password: Joi.string().min(8).required().messages({
    "string.min": "Password must be at least 8 characters",
  }),
  first_name: Joi.string().optional().allow("", null),
  last_name: Joi.string().optional().allow("", null),
  is_active: Joi.boolean().optional(),
  company_id: Joi.string().required(),
});

export function validateCreateCompanyAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { error, value } = createCompanyAdminSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    const messages = error.details.map((d) => d.message);
    errorResponse(res, "Validation failed", 400, messages);
    return;
  }
  req.body = value;
  next();
}

