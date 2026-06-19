import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { errorResponse } from "@/shared/utils/response";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const createUserSchema = Joi.object({
  company_id: Joi.string().uuid().required(),
  email: Joi.string().pattern(emailPattern).required().messages({
    "string.pattern.base": "Invalid email format",
  }),
  password_hash: Joi.string().required(),
  first_name: Joi.string().optional().allow("", null),
  last_name: Joi.string().optional().allow("", null),
  role: Joi.string()
    .valid("member", "company_admin")
    .default("member")
    .optional(),
  is_active: Joi.boolean().optional(),
});

export const updateUserSchema = Joi.object({
  email: Joi.string().pattern(emailPattern).optional().messages({
    "string.pattern.base": "Invalid email format",
  }),
  password_hash: Joi.string().optional(),
  first_name: Joi.string().optional().allow("", null),
  last_name: Joi.string().optional().allow("", null),
  role: Joi.string().valid("member", "company_admin").optional(),
  is_active: Joi.boolean().optional(),
}).min(1);

export function validateCreateUser(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { error, value } = createUserSchema.validate(req.body, {
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

export function validateUpdateUser(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { error, value } = updateUserSchema.validate(req.body, {
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
