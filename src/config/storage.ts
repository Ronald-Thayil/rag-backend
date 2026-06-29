import { env } from "./env";

export const storageConfig = {
  endpoint: process.env.STORAGE_ENDPOINT || "",
  region: process.env.STORAGE_REGION || "auto",
  accessKeyId: process.env.STORAGE_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY || "",
  bucket: process.env.STORAGE_BUCKET || "rag-uploads",
  publicUrl: process.env.STORAGE_PUBLIC_URL || "",
  forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE === "true",

  signedUrlExpires: parseInt(process.env.STORAGE_SIGNED_URL_EXPIRES || "3600", 10),

  maxFileSize: parseInt(process.env.STORAGE_MAX_FILE_SIZE || "10485760", 10),

  allowedMimeTypes: (process.env.STORAGE_ALLOWED_MIME_TYPES || "")
    .split(",")
    .filter(Boolean),
};

const required = ["STORAGE_ENDPOINT", "STORAGE_ACCESS_KEY_ID", "STORAGE_SECRET_ACCESS_KEY"] as const;
for (const key of required) {
  if (!process.env[key]) {
    console.warn(`[storage] Missing recommended env var: ${key} — storage operations will fail until set`);
  }
}
