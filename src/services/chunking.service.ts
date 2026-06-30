import { get_encoding } from "tiktoken";
import { chunkConfig } from "@/config/embedding";
import { logger } from "@/config/logger";

export interface ChunkResult {
  content: string;
  chunkIndex: number;
  tokenCount: number;
  charCount: number;
  startPosition: number;
  endPosition: number;
}

export class ChunkingService {
  private tokenLimit: number;
  private overlapTokens: number;
  private minTokens: number;
  private maxTokens: number;

  constructor() {
    this.tokenLimit = chunkConfig.tokenLimit;
    this.overlapTokens = Math.round(chunkConfig.tokenLimit * (chunkConfig.overlapPercent / 100));
    this.minTokens = chunkConfig.minTokens;
    this.maxTokens = chunkConfig.maxTokens;
  }

  chunkText(text: string): ChunkResult[] {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const tokenLimit = Math.min(this.tokenLimit, this.maxTokens);
    const encoding = get_encoding("cl100k_base");

    try {
      const sentences = this.splitSentences(text);
      if (sentences.length === 0) {
        return [];
      }

      const chunks: ChunkResult[] = [];
      let currentChunk: string[] = [];
      let currentTokens = 0;
      let charPos = 0;

      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];
        const sentenceTokens = encoding.encode(sentence).length;

        if (sentenceTokens > tokenLimit) {
          if (currentChunk.length > 0) {
            const chunkText = currentChunk.join(" ");
            const chunkTokens = encoding.encode(chunkText).length;
            chunks.push({
              content: chunkText.trim(),
              chunkIndex: chunks.length,
              tokenCount: chunkTokens,
              charCount: chunkText.length,
              startPosition: charPos - chunkText.length,
              endPosition: charPos,
            });
            currentChunk = [];
            currentTokens = 0;
          }

          const words = sentence.split(/\s+/);
          const wordChunks: string[] = [];
          let wordGroup: string[] = [];
          let wordTokens = 0;

          for (const word of words) {
            const wordToken = encoding.encode(word + " ").length;
            if (wordTokens + wordToken > tokenLimit) {
              if (wordGroup.length > 0) {
                wordChunks.push(wordGroup.join(" "));
              }
              wordGroup = [word];
              wordTokens = wordToken;
            } else {
              wordGroup.push(word);
              wordTokens += wordToken;
            }
          }
          if (wordGroup.length > 0) {
            wordChunks.push(wordGroup.join(" "));
          }

          for (const wc of wordChunks) {
            const wcTokens = encoding.encode(wc).length;
            chunks.push({
              content: wc.trim(),
              chunkIndex: chunks.length,
              tokenCount: wcTokens,
              charCount: wc.length,
              startPosition: charPos,
              endPosition: charPos + wc.length,
            });
            charPos += wc.length + 1;
          }
          continue;
        }

        if (currentTokens + sentenceTokens > tokenLimit && currentChunk.length > 0) {
          const chunkText = currentChunk.join(" ");
          const chunkTokens = encoding.encode(chunkText).length;
          chunks.push({
            content: chunkText.trim(),
            chunkIndex: chunks.length,
            tokenCount: chunkTokens,
            charCount: chunkText.length,
            startPosition: charPos - chunkText.length,
            endPosition: charPos,
          });

          const overlap = this.buildOverlap(currentChunk, encoding);
          currentChunk = [...overlap];
          currentTokens = encoding.encode(overlap.join(" ")).length;
        }

        currentChunk.push(sentence);
        currentTokens += sentenceTokens;
        charPos += sentence.length + 1;
      }

      if (currentChunk.length > 0) {
        const chunkText = currentChunk.join(" ");
        const chunkTokens = encoding.encode(chunkText).length;
        if (chunkTokens >= this.minTokens || chunks.length === 0) {
          chunks.push({
            content: chunkText.trim(),
            chunkIndex: chunks.length,
            tokenCount: chunkTokens,
            charCount: chunkText.length,
            startPosition: charPos - chunkText.length,
            endPosition: charPos,
          });
        }
      }

      return chunks;
    } finally {
      encoding.free();
    }
  }

  private splitSentences(text: string): string[] {
    const normalized = text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n");

    const abbreviations =
      /\b(Dr|Mr|Mrs|Ms|Prof|Sr|Jr|St|Ave|Blvd|Rd|Dept|vs|etc|Inc|Ltd|Co|Fig|e\.g|i\.e)\.$/i;

    const sentences: string[] = [];
    const parts = normalized.split(/(?<=[.!?])\s+/);

    for (let i = 0; i < parts.length; i++) {
      const trimmed = parts[i].trim();
      if (!trimmed) continue;

      if (
        i < parts.length - 1 &&
        abbreviations.test(trimmed)
      ) {
        parts[i + 1] = trimmed + " " + parts[i + 1];
        continue;
      }

      sentences.push(trimmed);
    }

    return sentences;
  }

  private buildOverlap(sentences: string[], encoding: ReturnType<typeof get_encoding>): string[] {
    const overlap: string[] = [];
    let overlapTokens = 0;

    for (let i = sentences.length - 1; i >= 0; i--) {
      const sentenceTokens = encoding.encode(sentences[i]).length;
      if (overlapTokens + sentenceTokens > this.overlapTokens) {
        break;
      }
      overlap.unshift(sentences[i]);
      overlapTokens += sentenceTokens;
    }

    return overlap;
  }
}

export default ChunkingService;
