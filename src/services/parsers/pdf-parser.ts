import { logger } from "@/config/logger";
import { Parser, ParseResult, FileFormat } from "./parser-factory";

export class PdfParser implements Parser {
  supports(extension: string): boolean {
    return extension === FileFormat.PDF;
  }

  async parse(buffer: Buffer): Promise<ParseResult> {
    if (buffer.length === 0) {
      throw new Error("PDF file is empty");
    }

    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });

    let text: string;
    let numpages = 0;
    let info: Record<string, unknown> = {};

    try {
      const textResult = await parser.getText({
        lineEnforce: true,
        pageJoiner: "\n\n",
      });
      text = textResult.text || "";
      numpages = textResult.total || 0;

      try {
        const infoResult = await parser.getInfo();
        info = (infoResult.info as Record<string, unknown>) || {};
      } catch {
        // Metadata extraction is optional
      }
    } catch (error) {
      logger.error("PDF parse failed", { error });
      throw new Error(
        `Failed to parse PDF: ${(error as Error).message}`
      );
    } finally {
      await parser.destroy().catch(() => {});
    }

    const metadata: ParseResult["metadata"] = {
      pageCount: numpages,
    };

    if (info.Title) metadata.title = String(info.Title);
    if (info.Author) metadata.author = String(info.Author);

    return { text, metadata };
  }
}

export default PdfParser;
