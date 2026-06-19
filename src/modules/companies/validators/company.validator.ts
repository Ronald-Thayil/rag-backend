import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { errorResponse } from "@/shared/utils/response";

export const createCompanySchema = Joi.object({
  name: Joi.string().required(),
  slug: Joi.string()
    .pattern(/^[a-z0-9-]+$/)
    .required()
    .messages({
      "string.pattern.base":
        "slug must contain only lowercase letters, numbers, and hyphens",
    }),
  settings: Joi.object().optional(),
});

export const updateCompanySchema = Joi.object({
  name: Joi.string().optional(),
  slug: Joi.string()
    .pattern(/^[a-z0-9-]+$/)
    .optional()
    .messages({
      "string.pattern.base":
        "slug must contain only lowercase letters, numbers, and hyphens",
    }),
  settings: Joi.object().optional(),
}).min(1);

export function validateCreateCompany(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { error, value } = createCompanySchema.validate(req.body, {
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

export function validateUpdateCompany(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { error, value } = updateCompanySchema.validate(req.body, {
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
