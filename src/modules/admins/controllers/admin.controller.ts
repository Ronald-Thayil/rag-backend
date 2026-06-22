import { Request, Response, NextFunction } from "express";
import { AdminService } from "@/modules/admins/services/admin.service";
import { successResponse } from "@/shared/utils/response";

export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const admin = await this.adminService.createAdmin(req.body);
      const { password_hash, ...safeAdmin } = admin.toJSON();
      successResponse(res, safeAdmin, "Admin created successfully", 201);
    } catch (error) {
      next(error);
    }
  };

  createCompanyAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const admin = await this.adminService.createCompanyAdmin(req.body);
      const { password_hash, ...safeAdmin } = admin.toJSON();
      successResponse(res, safeAdmin, "Company Admin created successfully", 201);
    } catch (error) {
      next(error);
    }
  };
}
