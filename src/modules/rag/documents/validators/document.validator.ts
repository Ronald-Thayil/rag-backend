import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { errorResponse } from "@/shared/utils/response";

const uploadMetadataSchema = Joi.object({
  title: Joi.string().max(255).optional(),
  tags: Joi.array().items(Joi.string().max(50)).max(20).optional(),
  description: Joi.string().max(1000).optional(),
}).optional();

export function validateUploadMetadata(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.body.metadata) {
    try {
      if (typeof req.body.metadata === "string") {
        req.body.metadata = JSON.parse(req.body.metadata);
      }
    } catch {
      errorResponse(res, "Invalid metadata JSON", 400);
      return;
    }

    const { error } = uploadMetadataSchema.validate(req.body.metadata);
    if (error) {
      errorResponse(res, `Invalid metadata: ${error.message}`, 400);
      return;
    }
  }

  next();
}

export default { validateUploadMetadata };
