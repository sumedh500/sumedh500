import express from "express";
import cors from "cors";
import { loadConfig } from "./config/env";
import { chatRouter } from "./routes";
import { errorHandler, requestLogger } from "./middleware";

const config = loadConfig();
const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());
app.use(requestLogger);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/chat", chatRouter);

// Must be registered after every route — Express identifies error
// middleware by its 4-argument signature, not by position, but it only
// catches errors from handlers registered before it.
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Backend listening on port ${config.port}`);
});
