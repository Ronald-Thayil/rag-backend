import { Request, Response, NextFunction } from "express";
import { Tenant } from "@/modules/tenants/tenant.model";
import { errorResponse } from "@/shared/utils/response";

export async function tenantMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const tenantId = req.headers["x-tenant-id"] as string | undefined;

  if (!tenantId) {
    errorResponse(res, "x-tenant-id header is required", 400);
    return;
  }

  try {
    const tenant = await Tenant.findByPk(tenantId, {
      attributes: ["id", "name", "slug", "is_active"],
    });

    if (!tenant) {
      errorResponse(res, "Tenant not found", 404);
      return;
    }

    if (!tenant.is_active) {
      errorResponse(res, "Tenant is inactive", 403);
      return;
    }

    req.tenant = tenant;
    next();
  } catch (error) {
    next(error);
  }
}
