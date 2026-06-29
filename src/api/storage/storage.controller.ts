import { Request, Response, NextFunction } from "express";
import { StorageService } from "@/services/storage.service";
import { assertValidFile } from "@/utils/file-validator";
import { storageConfig } from "@/config/storage";
import { successResponse } from "@/shared/utils/response";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { logger } from "@/config/logger";

const storageService = new StorageService();

function generateStorageKey(originalFilename: string, prefix = "uploads"): string {
  const ext = path.extname(originalFilename);
  const id = uuidv4();
  return `${prefix}/${id}${ext}`;
}

export class StorageController {
  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: "No file provided", data: null });
        return;
      }

      const { originalname, buffer, mimetype } = req.file;

      assertValidFile(originalname, buffer, {
        maxFileSize: storageConfig.maxFileSize,
      });

      const key = generateStorageKey(originalname);
      const result = await storageService.upload(key, buffer, mimetype);

      successResponse(res, {
        key: result.key,
        etag: result.etag,
        filename: originalname,
        mimeType: mimetype,
        size: buffer.length,
      }, "File uploaded successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  async download(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { key } = req.params;
      const file = await storageService.download(key);
      res.setHeader("Content-Type", file.contentType);
      res.send(file.body);
    } catch (error) {
      next(error);
    }
  }

  async getSignedUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { key } = req.params;
      const expiresIn = parseInt(req.query.expires as string, 10) || undefined;
      const url = await storageService.getSignedUrl(key, expiresIn);
      successResponse(res, { url, key, expiresIn });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { key } = req.params;
      await storageService.delete(key);
      successResponse(res, null, "File deleted successfully");
    } catch (error) {
      next(error);
    }
  }

  async healthCheck(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = await storageService.healthCheck();
      if (status.ok) {
        res.json({ status: "ok", storage: "connected", bucket: status.bucket });
      } else {
        res.status(503).json({ status: "error", storage: "disconnected", bucket: status.bucket });
      }
    } catch (error) {
      next(error);
    }
  }
}

export default StorageController;
