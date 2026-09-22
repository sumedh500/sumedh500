import type { NextFunction, Request, Response } from "express";

type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

// Express 4 doesn't catch rejected promises from async handlers on its
// own — an unawaited rejection would just hang the request. This forwards
// it to errorHandler via next() instead of wrapping every controller in
// try/catch.
export function asyncHandler(handler: AsyncRouteHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    handler(req, res, next).catch(next);
  };
}
