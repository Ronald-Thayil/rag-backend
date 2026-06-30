import Queue from "bull";
import { queueConfig } from "@/config/queue";
import { logger } from "@/config/logger";

export interface DocumentJobData {
  documentId: string;
  companyId: string;
  storagePath: string;
  fileType: string;
}

class QueueService {
  private documentQueue: Queue.Queue<DocumentJobData>;

  constructor() {
    this.documentQueue = new Queue<DocumentJobData>(
      queueConfig.documentQueueName,
      queueConfig.redisUrl,
      {
        defaultJobOptions: {
          timeout: queueConfig.jobTimeout,
          attempts: queueConfig.maxAttempts,
          backoff: {
            type: "exponential",
            delay: queueConfig.backoffDelay,
          },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      }
    );

    this.documentQueue.on("completed", (job) => {
      logger.info("Document processing job completed", {
        jobId: job.id,
        documentId: job.data.documentId,
      });
    });

    this.documentQueue.on("failed", (job, err) => {
      logger.error("Document processing job failed", {
        jobId: job.id,
        documentId: job.data.documentId,
        error: err.message,
        attempts: job.attemptsMade,
      });
    });

    this.documentQueue.on("error", (err) => {
      logger.error("Queue error", { error: err.message });
    });
  }

  async enqueueDocumentProcessing(data: DocumentJobData): Promise<string> {
    const job = await this.documentQueue.add(data);
    const jobId = String(job.id);
    logger.info("Document processing job enqueued", {
      jobId,
      documentId: data.documentId,
    });
    return jobId;
  }

  getQueue(): Queue.Queue<DocumentJobData> {
    return this.documentQueue;
  }

  async close(): Promise<void> {
    await this.documentQueue.close();
  }
}

export const queueService = new QueueService();
export default QueueService;
