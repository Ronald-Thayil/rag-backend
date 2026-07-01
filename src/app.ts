import "reflect-metadata";
import express from "express";
import cookieParser from "cookie-parser";
import routes from "@/routes";
import { requestLoggerMiddleware } from "@/shared/middleware/request-logger.middleware";
import { errorMiddleware } from "@/shared/middleware/error.middleware";
import cors from "cors";
import { env } from "./config/env";


const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(requestLoggerMiddleware);
// add cors 
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) callback(null, true);
        else if (env.ORIGINS.includes(origin)) callback(null, true);
        else callback(new Error("Not allowed by CORS"), false);
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}));
app.use(routes);

app.use(errorMiddleware);

export default app;
