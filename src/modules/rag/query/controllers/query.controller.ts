import { Request, Response, NextFunction } from "express";
import { QueryService } from "@/services/query.service";
import { paginatedResponse, getPaginationParams } from "@/shared/utils/response";

const queryService = new QueryService();

export class QueryController {
  async query(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.company?.id || req.user?.company_id;

      if (!companyId) {
        res.status(401).json({
          success: false,
          message: "Company context required. Provide x-company-id header.",
          data: null,
        });
        return;
      }

      const result = await queryService.query(companyId, {
        query: req.body.query,
        documentId: req.body.documentId,
        topK: req.body.topK,
        includeSources: req.body.includeSources,
      });

      res.status(200).json({
        success: true,
        message: "Query processed successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async listAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.company?.id || req.user?.company_id;

      if (!companyId) {
        res.status(401).json({
          success: false,
          message: "Company context required. Provide x-company-id header.",
          data: null,
        });
        return;
      }

      const result = await queryService.listAuditLogs(companyId);

      res.status(200).json({
        success: true,
        message: "Audit logs fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCompanyQueryStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.company?.id || req.user?.company_id;

      if (!companyId) {
        res.status(401).json({
          success: false,
          message: "Company context required. Provide x-company-id header.",
          data: null,
        });
        return;
      }

      const { page, limit } = getPaginationParams(req.query);

      const result = await queryService.getCompanyQueryStats(companyId, page, limit);

      paginatedResponse(res, result.data, result.total, result.page, result.limit, "Company query stats fetched successfully");
    } catch (error) {
      next(error);
    }
  }
}

export default QueryController;
