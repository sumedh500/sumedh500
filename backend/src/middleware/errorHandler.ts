import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { RateLimitError } from "groq-sdk";

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

  if (error instanceof RateLimitError) {
    // Free-tier Groq accounts have a daily token cap — this fires once
    // that's exhausted. Distinct status + message from the generic 500 so
    // the frontend can tell "temporarily out of capacity, try later" apart
    // from "something is actually broken."
    console.error("Groq rate limit hit:", error.message);
    res.status(429).json({
      error: "rate_limit",
      message: "The assistant is temporarily at capacity (Groq API rate limit reached). Please try again in a minute.",
    });
    return;
  }

  console.error("Unhandled error:", error);
  res.status(500).json({ error: "Something went wrong. Please try again." });
}
