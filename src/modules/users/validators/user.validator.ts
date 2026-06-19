import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { errorResponse } from "@/shared/utils/response";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const createUserSchema = Joi.object({
  first_name: Joi.string().max(100).required(),
  last_name: Joi.string().max(100).required(),
  email: Joi.string().max(255).pattern(emailPattern).required().messages({
    "string.pattern.base": "Invalid email format",
  }),
  phone: Joi.string().max(20).optional().allow("", null),
  role: Joi.string()
    .valid("SUPER_ADMIN", "ADMIN", "USER")
    .required()
    .messages({
      "any.only": "Role must be one of: SUPER_ADMIN, ADMIN, USER",
    }),
  password_hash: Joi.string().optional().allow("", null),
  tenant_id: Joi.string().uuid().required(),
});

export const updateUserSchema = Joi.object({
  first_name: Joi.string().max(100).optional(),
  last_name: Joi.string().max(100).optional(),
  email: Joi.string().max(255).pattern(emailPattern).optional().messages({
    "string.pattern.base": "Invalid email format",
  }),
  phone: Joi.string().max(20).optional().allow("", null),
  role: Joi.string()
    .valid("SUPER_ADMIN", "ADMIN", "USER")
    .optional()
    .messages({
      "any.only": "Role must be one of: SUPER_ADMIN, ADMIN, USER",
    }),
  password_hash: Joi.string().optional().allow("", null),
  is_active: Joi.boolean().optional(),
  tenant_id: Joi.string().uuid().optional(),
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
