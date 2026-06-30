export const queueConfig = {
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  jobTimeout: parseInt(process.env.JOB_TIMEOUT_SECONDS || "300", 10) * 1000,
  maxAttempts: parseInt(process.env.JOB_MAX_ATTEMPTS || "3", 10),
  backoffDelay: parseInt(process.env.JOB_BACKOFF_DELAY_MS || "2000", 10),
  documentQueueName: process.env.DOCUMENT_QUEUE_NAME || "document-processing",
};
