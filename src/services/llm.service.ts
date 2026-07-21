/**
 * LLM Service — Answer Generation
 *
 * Core generation component of the RAG pipeline. Takes retrieved context chunks
 * and a user question, then calls the LLM (OpenAI-compatible) to produce a
 * grounded answer.
 *
 * Key design decisions:
 *
 * 1. System Prompt (10 rules) — Strictly enforces grounded generation:
 *    - Answer ONLY from context, never outside knowledge.
 *    - Combine multiple relevant chunks; ignore irrelevant ones.
 *    - Explicitly state when information is incomplete.
 *    - "does not contain enough information" escape hatch to prevent hallucination.
 *    - Require citations (chunk IDs, document names, page numbers).
 *    - Preserve document wording; avoid excessive paraphrasing.
 *    - Output markdown tables for comparison questions.
 *
 * 2. User Prompt (4-step reasoning) — Guides the model's internal chain-of-thought:
 *    - Step 1: Identify relevant chunks.
 *    - Step 2: Ignore irrelevant chunks.
 *    - Step 3: Synthesize answer from relevant chunks only.
 *    - Step 4: Provide citations.
 *    These steps are NOT exposed in the final answer — they guide the CoT internally.
 *
 * 3. Structured Context Formatting — Each chunk is labeled with:
 *    - [Chunk N] index for easy reference
 *    - Chunk ID, Source filename, Page number, Relevance score %
 *    - Separated by horizontal rules for visual parsing
 *
 * Backward compatible: accepts either ContextChunk[] (new) or a raw string (old).
 */
import OpenAI from "openai";
import { embeddingConfig, queryConfig } from "@/config/embedding";
import { logger } from "@/config/logger";

/** Result from an LLM generation call with token usage tracking. */
export interface LlmResult {
  answer: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
}

/**
 * A single context chunk with optional metadata for structured formatting.
 * The LLM sees the chunk as: [Chunk N] (ID: ...) | Source: ... | Page: ... | Relevance: ...%
 * This enables precise citation in the answer (Priority 1, rule 8).
 */
export interface ContextChunk {
  content: string;
  chunkId?: string;
  documentId?: string;
  documentFilename?: string;
  pageNumber?: number;
  similarity?: number;
}

export class LlmService {
  private client: OpenAI;
  private model: string;

  constructor() {
    if (!embeddingConfig.apiKey) {
      logger.warn("OPENAI_API_KEY not set — LLM calls will fail");
    }
    this.client = new OpenAI({ apiKey: embeddingConfig.apiKey });
    this.model = queryConfig.llmModel;
  }

  /**
   * Format chunks into a structured, citation-friendly context block.
   * Each chunk gets: [Chunk N] (ID: ...) | Source: ... | Page: ... | Relevance: ...%
   * Chunks are separated by "---" horizontal rules for visual clarity.
   */
  private formatContext(chunks: ContextChunk[]): string {
    return chunks
      .map((chunk, index) => {
        const header = `[Chunk ${index + 1}]`;
        const id = chunk.chunkId ? ` (ID: ${chunk.chunkId})` : "";
        const src = chunk.documentFilename
          ? ` | Source: ${chunk.documentFilename}`
          : "";
        const page = chunk.pageNumber ? ` | Page: ${chunk.pageNumber}` : "";
        const sim =
          chunk.similarity !== undefined
            ? ` | Relevance: ${(chunk.similarity * 100).toFixed(1)}%`
            : "";
        return `${header}${id}${src}${page}${sim}\n${chunk.content}`;
      })
      .join("\n\n---\n\n");
  }

  /**
   * Generate a grounded answer from context and a question.
   *
   * @param question - The user's original question (not the rewritten one).
   * @param context  - Array of ContextChunk (new) or raw string (backward compat).
   * @param includeSources - Whether source metadata is included (unused in prompt but kept for API compat).
   */
  async generateAnswer(
    question: string,
    context: string | ContextChunk[],
    includeSources: boolean,
  ): Promise<LlmResult> {
    const formattedContext = Array.isArray(context)
      ? this.formatContext(context)
      : context;

    /* ── Priority 1: Strict grounded generation rules ──────────────────── */
    const systemPrompt = `You are a retrieval-augmented assistant.

Rules:

1. Answer ONLY using the provided context.
2. Never use outside knowledge.
3. If multiple chunks are relevant, combine information from all of them.
4. Ignore irrelevant chunks entirely.
5. If the information is incomplete, explicitly state what is missing.
6. Never invent facts or make assumptions not supported by the context.
7. If the answer cannot be found in the provided context at all, respond exactly:
   "The provided context does not contain enough information to answer this question."
8. When possible, cite chunk IDs, document names, and page numbers in your answer.
9. Preserve wording from the document when appropriate instead of paraphrasing excessively.
10. If the question requests a comparison, output a markdown table whenever appropriate.`;

    /* ── Priority 2: Internal reasoning steps (hidden from final answer) ─ */
    const userPrompt = `Context:
${formattedContext}

Question: ${question}

Step 1 — Identify which retrieved chunks are relevant to the question.
Step 2 — Ignore any chunks that are not relevant.
Step 3 — Synthesize the answer using only the relevant chunks.
Step 4 — Provide citations for each claim using chunk IDs or document names.

Answer:`;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    });

    const usage = response.usage;
    const answer = response.choices[0]?.message?.content || "";

    return {
      answer,
      promptTokens: usage?.prompt_tokens || 0,
      completionTokens: usage?.completion_tokens || 0,
      totalTokens: usage?.total_tokens || 0,
      model: this.model,
    };
  }
}

export default LlmService;
