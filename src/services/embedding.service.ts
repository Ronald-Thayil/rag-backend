import OpenAI from "openai";
import { embeddingConfig } from "@/config/embedding";
import { logger } from "@/config/logger";

export interface EmbeddingResult {
  chunkId: string;
  vector: number[];
}

export class EmbeddingService {
  private client: OpenAI;
  private model: string;
  private batchSize: number;
  private rateLimitMs: number;
  private maxRetries: number;

  constructor() {
    if (!embeddingConfig.apiKey) {
      logger.warn("OPENAI_API_KEY not set — embeddings will fail");
    }
    this.client = new OpenAI({ apiKey: embeddingConfig.apiKey });
    this.model = embeddingConfig.model;
    this.batchSize = embeddingConfig.batchSize;
    this.rateLimitMs = embeddingConfig.rateLimitMs;
    this.maxRetries = embeddingConfig.maxRetries;
  }

  async embedTexts(texts: string[]): Promise<number[][]> {
    const vectors: number[][] = [];

    for (let i = 0; i < texts.length; i += this.batchSize) {
      const batch = texts.slice(i, i + this.batchSize);
      const batchVectors = await this.embedBatchWithRetry(batch);
      vectors.push(...batchVectors);

      if (i + this.batchSize < texts.length) {
        await this.sleep(this.rateLimitMs);
      }
    }

    return vectors;
  }

  private async embedBatchWithRetry(texts: string[], attempt = 1): Promise<number[][]> {
    try {
      return await this.embedBatch(texts);
    } catch (error) {
      if (!this.isRetryable(error)) {
        throw error;
      }

      if (attempt >= this.maxRetries) {
        logger.error("Embedding retries exhausted", { attempt, error });
        throw new Error(
          `Embedding failed after ${this.maxRetries} retries: ${(error as Error).message}`
        );
      }

      const delay = Math.pow(2, attempt) * 1000;
      logger.warn("Embedding retry", { attempt, delay, error: (error as Error).message });
      await this.sleep(delay);
      return this.embedBatchWithRetry(texts, attempt + 1);
    }
  }

  private async embedBatch(texts: string[]): Promise<number[][]> {
    const response = await this.client.embeddings.create({
      model: this.model,
      input: texts,
    });

    const sorted = response.data.sort((a, b) => a.index - b.index);
    return sorted.map((item) => item.embedding);
  }

  private isRetryable(error: unknown): boolean {
    if (error instanceof OpenAI.RateLimitError) return true;
    if (error instanceof OpenAI.APIConnectionError) return true;
    if (error instanceof OpenAI.InternalServerError) return true;
    if (error instanceof OpenAI.APIConnectionTimeoutError) return true;

    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default EmbeddingService;
