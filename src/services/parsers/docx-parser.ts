import mammoth from "mammoth";
import { logger } from "@/config/logger";
import { Parser, ParseResult, FileFormat } from "./parser-factory";

export class DocxParser implements Parser {
  supports(extension: string): boolean {
    return extension === FileFormat.DOCX;
  }

  async parse(buffer: Buffer): Promise<ParseResult> {
    if (buffer.length === 0) {
      throw new Error("DOCX file is empty");
    }

    let result: Awaited<ReturnType<typeof mammoth.extractRawText>>;

    try {
      result = await mammoth.extractRawText({ buffer });
    } catch (error) {
      logger.error("DOCX parse failed", { error });
      throw new Error(
        `Failed to parse DOCX: ${(error as Error).message}`
      );
    }

    const text = result.value || "";

    const metadata: ParseResult["metadata"] = {};

    if (result.messages && result.messages.length > 0) {
      logger.warn("DOCX parse warnings", {
        warnings: result.messages.filter((m) => m.type === "warning").map((m) => m.message),
      });
    }

    return { text, metadata };
  }
}

export default DocxParser;
