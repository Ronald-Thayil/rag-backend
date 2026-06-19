import "reflect-metadata";
import express from "express";
import routes from "@/routes";
import { requestLoggerMiddleware } from "@/shared/middleware/request-logger.middleware";
import { errorMiddleware } from "@/shared/middleware/error.middleware";
    
const app = express();

app.use(express.json());
app.use(requestLoggerMiddleware);

app.use(routes);

app.use(errorMiddleware);

export default app;
