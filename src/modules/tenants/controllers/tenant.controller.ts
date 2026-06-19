import { Request, Response, NextFunction } from "express";
import { TenantService } from "@/modules/tenants/services/tenant.service";
import { successResponse } from "@/shared/utils/response";

export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenant = await this.tenantService.createTenant(req.body, req.user?.id);
      successResponse(res, tenant, "Tenant created successfully", 201);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenant = await this.tenantService.getTenantById(req.params.id);
      successResponse(res, tenant);
    } catch (error) {
      next(error);
    }
  };

  getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenants = await this.tenantService.getTenants();
      successResponse(res, tenants);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenant = await this.tenantService.updateTenant(req.params.id, req.body, req.user?.id);
      successResponse(res, tenant, "Tenant updated successfully");
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.tenantService.deleteTenant(req.params.id, req.user?.id);
      successResponse(res, null, "Tenant deleted successfully");
    } catch (error) {
      next(error);
    }
  };
}

export default TenantController;
