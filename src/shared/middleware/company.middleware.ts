import { Request, Response, NextFunction } from "express";
import { Company } from "@/modules/companies/company.model";
import { errorResponse } from "@/shared/utils/response";
import sequelize from "@/db";

/*
  Middleware that:
    1. Reads x-company-id from the request header
    2. Validates the company exists
    3. Attaches the company to req.company
    4. Sets PostgreSQL session variables for RLS enforcement:
         - app.current_company_id  → RLS filters rows BY company_id
         - app.current_admin_id    → bypasses company isolation (admins only)
         - app.current_user_id     → populates created_by / updated_by
*/

export async function companyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const companyId = req.headers["x-company-id"] as string | undefined;

  if (!companyId) {
    errorResponse(res, "x-company-id header is required", 400);
    return;
  }

  try {
    const company = await Company.findByPk(companyId, {
      attributes: ["id", "name", "slug"],
    });

    if (!company) {
      errorResponse(res, "Company not found", 404);
      return;
    }

    req.company = company;

    // ── Set PostgreSQL session context for RLS ──────────────
    await sequelize.query(
      `SELECT set_config('app.current_company_id', :companyId, false)`,
      { replacements: { companyId: company.id } }
    );

    if (req.admin?.id) {
      await sequelize.query(
        `SELECT set_config('app.current_admin_id', :adminId, false)`,
        { replacements: { adminId: req.admin.id } }
      );
    }

    if (req.user?.id) {
      await sequelize.query(
        `SELECT set_config('app.current_user_id', :userId, false)`,
        { replacements: { userId: req.user.id } }
      );
    }

    next();
  } catch (error) {
    next(error);
  }
}
