import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

// Express identifies error-handling middleware by arity (4 params) — the
// unused params still have to be declared for that to work, even though
// only `error` and `res` are used here.
export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: "Invalid request",
      details: error.issues.map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`),
    });
    return;
  }

  console.error("Unhandled error:", error);
  res.status(500).json({ error: "Something went wrong. Please try again." });
}
