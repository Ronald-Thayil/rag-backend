import { Request, Response, NextFunction } from "express";
import { QueryService } from "@/services/query.service";

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
}

export default QueryController;
