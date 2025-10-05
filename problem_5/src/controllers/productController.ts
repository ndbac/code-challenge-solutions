import { Request, Response } from "express";
import { productRepository } from "../repositories";
import { ApiError, asyncHandler } from "../middleware/errorHandler";
import {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ApiResponse,
  PaginatedResponse,
  ProductFilters,
} from "../types";

export class ProductController {
  static createProduct = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const productData: CreateProductRequest = req.body;

      const createdProduct = await productRepository.createProduct({
        name: productData.name,
        description: productData.description,
        price: productData.price,
        category: productData.category,
        stock_quantity: productData.stock_quantity || 0,
        is_active:
          productData.is_active !== undefined ? productData.is_active : true,
      });

      const response: ApiResponse<Product> = {
        success: true,
        data: createdProduct,
        message: "Product created successfully",
      };

      res.status(201).json(response);
    }
  );

  static getProducts = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const filters: ProductFilters = {
        name: req.query.name as string,
        category: req.query.category as string,
        price_min: req.query.price_min
          ? parseFloat(req.query.price_min as string)
          : undefined,
        price_max: req.query.price_max
          ? parseFloat(req.query.price_max as string)
          : undefined,
        is_active: req.query.is_active
          ? req.query.is_active === "true"
          : undefined,
      };

      const result = await productRepository.findProductsWithFilters(
        filters,
        page,
        limit
      );

      const response: PaginatedResponse<Product> = {
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      };

      res.json(response);
    }
  );

  static getProductById = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        throw new ApiError("Invalid product ID", 400);
      }

      const product = await productRepository.findById(Number(id));

      if (!product) {
        throw new ApiError("Product not found", 404);
      }

      const response: ApiResponse<Product> = {
        success: true,
        data: product,
      };

      res.json(response);
    }
  );

  static updateProduct = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;
      const updateData: UpdateProductRequest = req.body;

      if (!id || isNaN(Number(id))) {
        throw new ApiError("Invalid product ID", 400);
      }

      const updatedProduct = await productRepository.updateProduct(Number(id), {
        name: updateData.name,
        description: updateData.description,
        price: updateData.price,
        category: updateData.category,
        stock_quantity: updateData.stock_quantity,
        is_active: updateData.is_active,
      });

      if (!updatedProduct) {
        throw new ApiError("Product not found", 404);
      }

      const response: ApiResponse<Product> = {
        success: true,
        data: updatedProduct,
        message: "Product updated successfully",
      };

      res.json(response);
    }
  );

  static deleteProduct = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        throw new ApiError("Invalid product ID", 400);
      }

      const deleted = await productRepository.delete(Number(id));

      if (!deleted) {
        throw new ApiError("Product not found", 404);
      }

      const response: ApiResponse = {
        success: true,
        message: "Product deleted successfully",
      };

      res.json(response);
    }
  );
}
