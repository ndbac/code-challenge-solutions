import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { ApiError } from "./errorHandler";
import {
  createUserSchema,
  updateUserSchema,
  createProductSchema,
  updateProductSchema,
  userFiltersSchema,
  productFiltersSchema,
  idParamSchema,
} from "../validation/schemas";

export const validate = (
  schema: Joi.ObjectSchema,
  target: "body" | "query" | "params" = "body"
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join("; ");

      throw new ApiError(errorMessage, 400);
    }

    if (target === "body") {
      req.body = value;
    } else if (target === "params") {
      req.params = value;
    } else if (target === "query") {
      Object.assign(req.query, value);
    }
    next();
  };
};

export const validateCreateUser = validate(createUserSchema, "body");

export const validateUpdateUser = validate(updateUserSchema, "body");

export const validateCreateProduct = validate(createProductSchema, "body");

export const validateUpdateProduct = validate(updateProductSchema, "body");

export const validateUserQuery = validate(userFiltersSchema, "query");

export const validateProductQuery = validate(productFiltersSchema, "query");

export const validateIdParam = validate(idParamSchema, "params");

export const validatePagination = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const { page = 1, limit = 10 } = req.query;
  req.pagination = {
    page: parseInt(page as string) || 1,
    limit: parseInt(limit as string) || 10,
  };
  next();
};

declare global {
  namespace Express {
    interface Request {
      pagination?: {
        page: number;
        limit: number;
      };
    }
  }
}
