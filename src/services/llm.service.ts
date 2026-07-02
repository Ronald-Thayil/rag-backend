import OpenAI from "openai";
import { embeddingConfig, queryConfig } from "@/config/embedding";
import { logger } from "@/config/logger";

export interface LlmResult {
  answer: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
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

  async generateAnswer(question: string, context: string, includeSources: boolean): Promise<LlmResult> {
    const systemPrompt = `You are a helpful assistant that answers questions based only on the provided context.
Answer concisely and accurately using only the information from the context.
If the context does not contain enough information to answer, say so.
${includeSources ? "When referencing specific parts, cite the source document filename." : ""}`;

    const userPrompt = `Context:
${context}

Question: ${question}

Answer the question based on the context above.`;

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
