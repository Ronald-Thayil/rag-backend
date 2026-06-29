import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import { storageConfig } from "@/config/storage";
import { DEFAULT_ALLOWED_MIME_TYPES } from "@/utils/file-validator";

const ALLOWED_MIMES = storageConfig.allowedMimeTypes.length > 0
  ? storageConfig.allowedMimeTypes
  : DEFAULT_ALLOWED_MIME_TYPES;

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type "${file.mimetype}" is not allowed`));
  }
}

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: storageConfig.maxFileSize,
  },
  fileFilter,
});

export default upload;
