import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import router from "./router";
import httpStatus from "http-status";
import { ApiError } from "./utils/apiError";
import cookieParser from "cookie-parser";
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

const corsOptions = {
    origin: "http://localhost:5173",
    credentials: true,
    accessControlAllowOrigin: true,
};

app.use(cors(corsOptions));

app.use("/api/v1", router);
// send back a 404 error for any unknown api request
app.use((_req: Request, _res: Response, next: NextFunction) => {
    next(new ApiError(httpStatus.NOT_FOUND, "Not found"));
});

export default app;
