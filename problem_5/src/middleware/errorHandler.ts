import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../types";

export class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = "Internal Server Error";

  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error.message.includes("UNIQUE constraint failed")) {
    statusCode = 409;
    message = "Resource already exists with this unique field";
  } else if (error.message.includes("FOREIGN KEY constraint failed")) {
    statusCode = 400;
    message = "Invalid reference to related resource";
  } else if (error.message.includes("validation")) {
    statusCode = 400;
    message = error.message;
  } else if (error.message) {
    message = error.message;
  }

  console.error(`Error ${statusCode}: ${message}`);
  if (process.env.NODE_ENV === "development") {
    console.error(error.stack);
  }

  const response: ApiResponse = {
    success: false,
    error: message,
  };

  res.status(statusCode).json(response);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  const response: ApiResponse = {
    success: false,
    error: `Route ${req.originalUrl} not found`,
  };

  res.status(404).json(response);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
