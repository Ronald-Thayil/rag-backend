import { Request, Response, NextFunction } from "express";
import { DocumentService } from "@/modules/rag/documents/services/document.service";
import { DocumentRepository } from "@/modules/rag/documents/repositories/document.repository";
import { StorageService } from "@/services/storage.service";
import { successResponse } from "@/shared/utils/response";

const repository = new DocumentRepository();
const storageService = new StorageService();
const documentService = new DocumentService(repository, storageService);

export class DocumentController {
  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: "No file provided", data: null });
        return;
      }

      const companyId = req.company?.id || req.user?.company_id;
      const userId = req.admin?.id || req.user?.id;

      if (!companyId || !userId) {
        res.status(401).json({ success: false, message: "Authentication required", data: null });
        return;
      }

      const metadata = req.body.metadata as Record<string, unknown> | undefined;
      const result = await documentService.uploadDocument(
        companyId,
        userId,
        req.file,
        metadata
      );

      res.status(202).json({
        success: true,
        message: "File uploaded, processing started",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = await documentService.getDocumentStatus(req.params.id);
      successResponse(res, status);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doc = await documentService.getDocument(req.params.id);
      successResponse(res, doc);
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.company?.id || req.user?.company_id;
      if (!companyId) {
        res.status(401).json({ success: false, message: "Authentication required", data: null });
        return;
      }

      const limit = parseInt(req.query.limit as string, 10) || 20;
      const offset = parseInt(req.query.offset as string, 10) || 0;
      const result = await documentService.listDocuments(companyId, { limit, offset });

      successResponse(res, {
        documents: result.rows,
        total: result.count,
        limit,
        offset,
      });
    } catch (error) {
      next(error);
    }
  }

  async getChunks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const chunks = await documentService.getDocumentChunks(req.params.id);
      successResponse(res, chunks);
    } catch (error) {
      next(error);
    }
  }
}

export default DocumentController;
