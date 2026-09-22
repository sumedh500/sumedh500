import express from "express";
import cors from "cors";
import { loadConfig } from "./config/env";

const config = loadConfig();
const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Phase 3/4: mount chat routes here once the agent core exists.
// app.use("/chat", chatRoutes);

app.listen(config.port, () => {
  console.log(`Backend listening on port ${config.port}`);
});
