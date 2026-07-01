import { Document } from "@/modules/rag/documents/document.model";
import { Chunk } from "@/modules/rag/chunks/chunk.model";
import { PaginationOptions } from "@/shared/interfaces";
import { v4 as uuidv4 } from "uuid";

export interface CreateDocumentData {
  company_id: string;
  uploaded_by: string;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size_bytes: number;
  storage_path: string;
  metadata?: Record<string, unknown>;
}

export interface DocumentStatusResult {
  id: string;
  status: string;
  stage: string;
  percentComplete: number;
  errorMessage: string | null;
}

export class DocumentRepository {
  async create(data: CreateDocumentData): Promise<Document> {
    const document = await Document.create({
      id: uuidv4(),
      company_id: data.company_id,
      uploaded_by: data.uploaded_by,
      filename: data.filename,
      original_filename: data.original_filename,
      file_type: data.file_type,
      file_size_bytes: data.file_size_bytes,
      storage_path: data.storage_path,
      status: "processing",
      metadata: data.metadata || {},
      chunk_count: 0,
    });

    return document;
  }

  async findById(id: string): Promise<Document | null> {
    return Document.findByPk(id);
  }

  async getStatus(id: string): Promise<DocumentStatusResult | null> {
    const doc = await Document.findByPk(id, {
      attributes: ["id", "status", "error_message", "chunk_count", "raw_text", "completed_at"],
    });

    if (!doc) return null;

    return {
      id: doc.id,
      status: doc.status,
      stage: this.determineStage(doc),
      percentComplete: this.calculatePercent(doc),
      errorMessage: doc.error_message,
    };
  }

  async findByCompany(
    companyId: string,
    options: PaginationOptions
  ): Promise<{ rows: Document[]; count: number }> {
    return Document.findAndCountAll({
      where: { company_id: companyId },
      order: [["created_at", "DESC"]],
      limit: options.limit,
      offset: options.offset,
    });
  }

  async getChunks(
    documentId: string,
    options?: PaginationOptions
  ): Promise<{ rows: Chunk[]; count: number }> {
    if (options) {
      return Chunk.findAndCountAll({
        where: { document_id: documentId },
        order: [["chunk_index", "ASC"]],
        limit: options.limit,
        offset: options.offset,
      });
    }
    const rows = await Chunk.findAll({
      where: { document_id: documentId },
      order: [["chunk_index", "ASC"]],
    });
    return { rows, count: rows.length };
  }

  private determineStage(doc: Document): string {
    if (doc.status === "ready") return "complete";
    if (doc.status === "failed") return "failed";
    if (doc.chunk_count && doc.chunk_count > 0) return "embedding";
    if (doc.raw_text) return "chunking";
    return "parsing";
  }

  private calculatePercent(doc: Document): number {
    if (doc.status === "ready") return 100;
    if (doc.status === "failed") return 0;
    if (doc.chunk_count && doc.chunk_count > 0) return 75;
    if (doc.raw_text) return 30;
    return 10;
  }
}

export default DocumentRepository;
