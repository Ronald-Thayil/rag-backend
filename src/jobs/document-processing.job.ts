import { Queue, Job } from "bull";
import { queueService, DocumentJobData } from "@/services/queue.service";
import { StorageService } from "@/services/storage.service";
import { ParserFactory } from "@/services/parsers/parser-factory";
import { ChunkingService, ChunkResult } from "@/services/chunking.service";
import { EmbeddingService } from "@/services/embedding.service";
import { Document } from "@/modules/rag/documents/document.model";
import { Chunk } from "@/modules/rag/chunks/chunk.model";
import { logger } from "@/config/logger";
import path from "path";

const storageService = new StorageService();
const parserFactory = new ParserFactory();
const chunkingService = new ChunkingService();
const embeddingService = new EmbeddingService();

async function processDocument(job: Job<DocumentJobData>): Promise<void> {
  const { documentId, companyId, storagePath, fileType } = job.data;
  const ext = path.extname(storagePath).replace(/^\./, "") || fileType;

  logger.info("Starting document processing", { documentId, stage: "download" });

  const file = await storageService.download(storagePath);

  logger.info("Document downloaded, starting parse", { documentId, stage: "parse" });

  let parseResult;
  try {
    parseResult = await parserFactory.parse(file.body, ext);
  } catch (error) {
    await Document.update(
      { status: "failed", error_message: `Parse failed: ${(error as Error).message}` },
      { where: { id: documentId } }
    );
    throw error;
  }

  const updateFields: Partial<Document> = {
    raw_text: parseResult.text,
    page_count: parseResult.metadata.pageCount || null,
    metadata: parseResult.metadata as Record<string, unknown>,
  };
  await Document.update(updateFields, { where: { id: documentId } });

  logger.info("Parse complete, starting chunking", {
    documentId,
    stage: "chunk",
    textLength: parseResult.text.length,
  });

  let chunks: ChunkResult[];
  try {
    chunks = chunkingService.chunkText(parseResult.text);
  } catch (error) {
    await Document.update(
      { status: "failed", error_message: `Chunking failed: ${(error as Error).message}` },
      { where: { id: documentId } }
    );
    throw error;
  }

  logger.info("Chunking complete, storing chunks", {
    documentId,
    stage: "store-chunks",
    chunkCount: chunks.length,
  });

  const chunkRecords = chunks.map((chunk) => ({
    id: undefined,
    company_id: companyId,
    document_id: documentId,
    content: chunk.content,
    chunk_index: chunk.chunkIndex,
    token_count: chunk.tokenCount,
    metadata: {
      charCount: chunk.charCount,
      startPosition: chunk.startPosition,
      endPosition: chunk.endPosition,
    },
  }));

  try {
    await Chunk.bulkCreate(chunkRecords);
  } catch (error) {
    await Document.update(
      { status: "failed", error_message: `Chunk storage failed: ${(error as Error).message}` },
      { where: { id: documentId } }
    );
    throw error;
  }

  await Document.update(
    { chunk_count: chunks.length },
    { where: { id: documentId } }
  );

  if (chunks.length === 0) {
    await Document.update(
      { status: "ready", completed_at: new Date() },
      { where: { id: documentId } }
    );
    logger.info("Document processed (no content to embed)", { documentId });
    return;
  }

  logger.info("Starting embedding", {
    documentId,
    stage: "embed",
    chunkCount: chunks.length,
  });

  try {
    const texts = chunks.map((c) => c.content);
    const vectors = await embeddingService.embedTexts(texts);

    const createdChunks = await Chunk.findAll({
      where: { document_id: documentId },
      order: [["chunk_index", "ASC"]],
    });

    for (let i = 0; i < createdChunks.length && i < vectors.length; i++) {
      await createdChunks[i].update({
        embedding: JSON.stringify(vectors[i]),
      });
    }
  } catch (error) {
    await Document.update(
      { status: "failed", error_message: `Embedding failed: ${(error as Error).message}` },
      { where: { id: documentId } }
    );
    throw error;
  }

  await Document.update(
    { status: "ready", completed_at: new Date() },
    { where: { id: documentId } }
  );

  logger.info("Document processing complete", { documentId, stage: "complete" });
}

export function registerDocumentProcessor(): void {
  const queue = queueService.getQueue();
  queue.process(async (job) => {
    await processDocument(job);
  });
  logger.info("Document processing worker registered");
}

export default registerDocumentProcessor;
