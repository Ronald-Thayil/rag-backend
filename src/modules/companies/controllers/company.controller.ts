import { Request, Response, NextFunction } from "express";
import { CompanyService } from "@/modules/companies/services/company.service";
import { successResponse } from "@/shared/utils/response";
import { UnauthorizedError } from "@/shared/errors/app-error";

export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.admin) throw new UnauthorizedError("Only admins can create companies");
      const company = await this.companyService.createCompany(req.body, req.admin.id);
      successResponse(res, company, "Company created successfully", 201);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const company = await this.companyService.getCompanyById(req.params.id);
      successResponse(res, company);
    } catch (error) {
      next(error);
    }
  };

  getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companies = await this.companyService.getCompanies();
      successResponse(res, companies);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.admin) throw new UnauthorizedError("Only admins can update companies");
      const company = await this.companyService.updateCompany(req.params.id, req.body, req.admin.id);
      successResponse(res, company, "Company updated successfully");
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.admin) throw new UnauthorizedError("Only admins can delete companies");
      await this.companyService.deleteCompany(req.params.id);
      successResponse(res, null, "Company deleted successfully");
    } catch (error) {
      next(error);
    }
  };
}

export default CompanyController;
