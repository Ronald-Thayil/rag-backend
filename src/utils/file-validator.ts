import mime from "mime-types";
import { BadRequestError } from "@/shared/errors/app-error";

export const DEFAULT_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain",
  "application/json",
  "image/jpeg",
  "image/png",
  "image/webp",
];

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
  const { allowedMimeTypes = DEFAULT_ALLOWED_MIME_TYPES, maxFileSize } = options;

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
