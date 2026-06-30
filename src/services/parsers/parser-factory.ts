import { logger } from "@/config/logger";
import { PdfParser } from "./pdf-parser";
import { DocxParser } from "./docx-parser";
import { XlsxParser } from "./xlsx-parser";

export enum FileFormat {
  PDF = "pdf",
  DOCX = "docx",
  XLSX = "xlsx",
  XLS = "xls",
}

export interface ParseResult {
  text: string;
  metadata: {
    pageCount?: number;
    sheetCount?: number;
    sheetNames?: string[];
    author?: string;
    title?: string;
    createdAt?: string;
  };
}

export interface Parser {
  parse(buffer: Buffer): Promise<ParseResult>;
  supports(extension: string): boolean;
}

export class ParserFactory {
  private parsers: Parser[];

  constructor() {
    this.parsers = [new PdfParser(), new DocxParser(), new XlsxParser()];
  }

  getParser(extension: string): Parser {
    const ext = extension.toLowerCase().replace(/^\./, "");
    for (const parser of this.parsers) {
      if (parser.supports(ext)) {
        return parser;
      }
    }
    throw new Error(`No parser available for file type: .${ext}`);
  }

  async parse(buffer: Buffer, extension: string): Promise<ParseResult> {
    const parser = this.getParser(extension);
    logger.info(`Parsing file`, { format: extension });
    const result = await parser.parse(buffer);
    logger.info(`Parse complete`, {
      format: extension,
      textLength: result.text.length,
      metadata: result.metadata,
    });
    return result;
  }
}

export default ParserFactory;
