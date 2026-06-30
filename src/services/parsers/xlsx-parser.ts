import * as XLSX from "xlsx";
import { logger } from "@/config/logger";
import { Parser, ParseResult, FileFormat } from "./parser-factory";

export class XlsxParser implements Parser {
  supports(extension: string): boolean {
    return extension === FileFormat.XLSX || extension === FileFormat.XLS;
  }

  async parse(buffer: Buffer): Promise<ParseResult> {
    if (buffer.length === 0) {
      throw new Error("XLSX file is empty");
    }

    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(buffer, { type: "buffer", cellFormula: false });
    } catch (error) {
      logger.error("XLSX parse failed", { error });
      throw new Error(
        `Failed to parse XLSX: ${(error as Error).message}`
      );
    }

    const sheetNames = workbook.SheetNames;
    const parts: string[] = [];

    for (const sheetName of sheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json<string[]>(sheet, {
        header: 1,
        defval: "",
        blankrows: false,
      });

      if (json.length > 0) {
        parts.push(`=== Sheet: ${sheetName} ===`);
        for (const row of json) {
          const rowStr = (Array.isArray(row) ? row : []).join("\t");
          parts.push(rowStr);
        }
        parts.push("");
      }
    }

    const text = parts.join("\n");

    const metadata: ParseResult["metadata"] = {
      sheetCount: sheetNames.length,
      sheetNames,
    };

    return { text, metadata };
  }
}

export default XlsxParser;
