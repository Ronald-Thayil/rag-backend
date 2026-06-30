import mime from "mime-types";
import { BadRequestError } from "@/shared/errors/app-error";

export const DEFAULT_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "text/plain",
  "application/json",
];

const MAGIC_BYTES: Record<string, Uint8Array[]> = {
  pdf: [new Uint8Array([0x25, 0x50, 0x44, 0x46])],
  docx: [new Uint8Array([0x50, 0x4b, 0x03, 0x04])],
  xlsx: [new Uint8Array([0x50, 0x4b, 0x03, 0x04])],
  xls: [
    new Uint8Array([0xd0, 0xcf, 0x11, 0xe0]),
    new Uint8Array([0x09, 0x08, 0x10, 0x00, 0x00, 0x06, 0x05, 0x00]),
  ],
};

export interface FileValidationOptions {
  allowedMimeTypes?: string[];
  maxFileSize?: number;
}

export interface FileValidationResult {
  valid: boolean;
  mimeType: string;
  extension: string;
  error?: string;
}

export function validateFile(
  filename: string,
  buffer: Buffer,
  options: FileValidationOptions = {}
): FileValidationResult {
  const {
    allowedMimeTypes = DEFAULT_ALLOWED_MIME_TYPES,
    maxFileSize,
  } = options;

  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const detectedMime = mime.lookup(filename) || "application/octet-stream";

  if (!allowedMimeTypes.includes(detectedMime)) {
    return {
      valid: false,
      mimeType: detectedMime,
      extension: ext,
      error: `File type "${detectedMime}" is not allowed. Allowed types: ${allowedMimeTypes.join(", ")}`,
    };
  }

  if (maxFileSize && buffer.length > maxFileSize) {
    const mb = (maxFileSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      mimeType: detectedMime,
      extension: ext,
      error: `File exceeds maximum size of ${mb} MB`,
    };
  }

  if (ext && MAGIC_BYTES[ext]) {
    const header = buffer.slice(0, 8);
    const matches = MAGIC_BYTES[ext].some((magic) => {
      if (header.length < magic.length) return false;
      for (let i = 0; i < magic.length; i++) {
        if (header[i] !== magic[i]) return false;
      }
      return true;
    });

    if (!matches) {
      return {
        valid: false,
        mimeType: detectedMime,
        extension: ext,
        error: `File header does not match expected format for .${ext} — possible file extension spoofing`,
      };
    }
  }

  return { valid: true, mimeType: detectedMime, extension: ext };
}

export function assertValidFile(
  filename: string,
  buffer: Buffer,
  options?: FileValidationOptions
): { mimeType: string; extension: string } {
  const result = validateFile(filename, buffer, options);
  if (!result.valid) {
    throw new BadRequestError(result.error!);
  }
  return { mimeType: result.mimeType, extension: result.extension };
}
