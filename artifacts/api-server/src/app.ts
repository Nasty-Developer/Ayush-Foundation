import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

app.use("/api", (_req, res) => {
  res.status(404).json({
    success: false,
    error: "API route not found.",
  });
});

app.use(
  (
    error: unknown,
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    if (res.headersSent) {
      next(error);
      return;
    }

    const requestId = String(
      (req as Request & { id?: string | number }).id ?? "unknown",
    );
    logger.error(
      {
        err: error,
        requestId,
        method: req.method,
        path: req.path,
      },
      "Unhandled API request failure",
    );

    const status =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      typeof error.status === "number"
        ? error.status
        : 500;

    res.status(status).json({
      success: false,
      error:
        status === 413
          ? "Uploaded file is too large."
          : "The API request could not be completed.",
      details: `Request ${requestId} failed. Check the API server logs for the exact failure point.`,
    });
  },
);

export default app;
