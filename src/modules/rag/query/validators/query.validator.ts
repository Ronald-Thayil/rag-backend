import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { errorResponse } from "@/shared/utils/response";

const querySchema = Joi.object({
  query: Joi.string().trim().min(1).required().messages({
    "string.empty": "Query must not be empty",
    "any.required": "Query is required",
  }),
  documentId: Joi.string().uuid().optional(),
  topK: Joi.number().integer().min(1).max(50).default(5),
  includeSources: Joi.boolean().default(true),
});

export function validateQuery(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { error, value } = querySchema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map((d) => d.message).join("; ");
    errorResponse(res, `Validation error: ${messages}`, 400);
    return;
  }

  req.body = value;
  next();
}

export default { validateQuery };
