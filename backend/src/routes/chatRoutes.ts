import { Router } from "express";
import { postChat } from "../controllers";
import { asyncHandler } from "../utils";

export const chatRouter = Router();

chatRouter.post("/", asyncHandler(postChat));
