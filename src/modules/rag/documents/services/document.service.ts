import { DocumentRepository } from "@/modules/rag/documents/repositories/document.repository";
import { StorageService } from "@/services/storage.service";
import { queueService } from "@/services/queue.service";
import { uploadConfig } from "@/config/embedding";
import { BadRequestError } from "@/shared/errors/app-error";
import { logger } from "@/config/logger";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const ALLOWED_EXTENSIONS = new Set(uploadConfig.allowedTypes);

export interface UploadResult {
  id: string;
  filename: string;
  originalFilename: string;
  fileType: string;
  fileSizeBytes: number;
  status: string;
  createdAt: Date;
}

export class DocumentService {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly storageService: StorageService
  ) {}

  async uploadDocument(
    companyId: string,
    userId: string,
    file: Express.Multer.File,
    metadata?: Record<string, unknown>
  ): Promise<UploadResult> {
    this.validateFile(file);

    const ext = path.extname(file.originalname).toLowerCase().replace(/^\./, "");
    const uniqueFilename = `${uuidv4()}.${ext}`;
    const storagePath = `company/${companyId}/${uniqueFilename}`;

    logger.info("Storing file in object storage", {
      storagePath,
      size: file.buffer.length,
      mimetype: file.mimetype,
    });

    await this.storageService.upload(storagePath, file.buffer, file.mimetype);

    const document = await this.documentRepository.create({
      company_id: companyId,
      uploaded_by: userId,
      filename: uniqueFilename,
      original_filename: file.originalname,
      file_type: ext,
      file_size_bytes: file.buffer.length,
      storage_path: storagePath,
      metadata,
    });

    await queueService.enqueueDocumentProcessing({
      documentId: document.id,
      companyId,
      storagePath,
      fileType: ext,
    });

    logger.info("Document upload complete", {
      documentId: document.id,
      storagePath,
    });

    return {
      id: document.id,
      filename: document.filename,
      originalFilename: document.original_filename,
      fileType: document.file_type,
      fileSizeBytes: document.file_size_bytes,
      status: document.status,
      createdAt: document.created_at,
    };
  }

  async getDocumentStatus(documentId: string) {
    const status = await this.documentRepository.getStatus(documentId);
    if (!status) {
      throw new BadRequestError("Document not found");
    }
    return status;
  }

  async getDocument(documentId: string) {
    const doc = await this.documentRepository.findById(documentId);
    if (!doc) {
      throw new BadRequestError("Document not found");
    }
    return doc;
  }

  async listDocuments(
    companyId: string,
    options?: { limit?: number; offset?: number }
  ) {
    return this.documentRepository.findByCompany(companyId, options);
  }

  async getDocumentChunks(documentId: string) {
    const doc = await this.documentRepository.findById(documentId);
    if (!doc) {
      throw new BadRequestError("Document not found");
    }
    return this.documentRepository.getChunks(documentId);
  }

  private validateFile(file: Express.Multer.File): void {
    const ext = path.extname(file.originalname).toLowerCase().replace(/^\./, "");
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      throw new BadRequestError(
        `File type ".${ext}" is not allowed. Allowed types: ${uploadConfig.allowedTypes.join(", ")}`
      );
    }

    const maxBytes = uploadConfig.maxFileSizeMb * 1024 * 1024;
    if (file.buffer.length > maxBytes) {
      throw new BadRequestError(
        `File exceeds maximum size of ${uploadConfig.maxFileSizeMb} MB`
      );
    }
  }
}

export default DocumentService;
