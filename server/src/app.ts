import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
// import pinoHttp from "pino-http";
import { ENV } from "./config/env";
import logger from "./utils/logger";
import router from "./routes/router";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();

app.use(cors({ origin: ENV.CLIENT_URL, credentials: true })); // credentials:true zaroori hai cookie ke liye
app.use(cookieParser());
app.use(express.json());
// app.use(pinoHttp({ logger }));

app.use("/api/v1", router);

app.use(errorHandler); // hamesha sabse last me

export default app;
