import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { errorResponse } from "@/shared/utils/response";

const createTenantSchema = Joi.object({
  name: Joi.string().max(255).required(),
  slug: Joi.string()
    .max(100)
    .pattern(/^[a-z0-9-]+$/)
    .required()
    .messages({
      "string.pattern.base": "slug must contain only lowercase letters, numbers, and hyphens",
    }),
  is_active: Joi.boolean().optional(),
});

const updateTenantSchema = Joi.object({
  name: Joi.string().max(255).optional(),
  slug: Joi.string()
    .max(100)
    .pattern(/^[a-z0-9-]+$/)
    .optional()
    .messages({
      "string.pattern.base": "slug must contain only lowercase letters, numbers, and hyphens",
    }),
  is_active: Joi.boolean().optional(),
}).min(1);

function validateCreateTenant(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { error, value } = createTenantSchema.validate(req.body, {
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

function validateUpdateTenant(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { error, value } = updateTenantSchema.validate(req.body, {
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

export {
  validateCreateTenant,
  validateUpdateTenant,
};

