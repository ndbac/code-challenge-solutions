import { Request, Response } from "express";
import { database } from "../database/connection";
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

      const sql = `
            INSERT INTO products (name, description, price, category, stock_quantity, is_active) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;

      const params = [
        productData.name,
        productData.description || null,
        productData.price,
        productData.category || null,
        productData.stock_quantity || 0,
        productData.is_active !== undefined ? productData.is_active : true,
      ];

      const result = await database.run(sql, params);

      if (!result.lastID) {
        throw new ApiError("Failed to create product", 500);
      }

      const createdProduct = await database.get<Product>(
        "SELECT * FROM products WHERE id = ?",
        [result.lastID]
      );

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

      const whereConditions: string[] = [];
      const params: any[] = [];

      if (filters.name) {
        whereConditions.push("name LIKE ?");
        params.push(`%${filters.name}%`);
      }

      if (filters.category) {
        whereConditions.push("category LIKE ?");
        params.push(`%${filters.category}%`);
      }

      if (filters.price_min) {
        whereConditions.push("price >= ?");
        params.push(filters.price_min);
      }

      if (filters.price_max) {
        whereConditions.push("price <= ?");
        params.push(filters.price_max);
      }

      if (filters.is_active !== undefined) {
        whereConditions.push("is_active = ?");
        params.push(filters.is_active ? 1 : 0);
      }

      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(" AND ")}`
          : "";

      const countSql = `SELECT COUNT(*) as count FROM products ${whereClause}`;
      const countResult = await database.get<{ count: number }>(
        countSql,
        params
      );
      const total = countResult?.count || 0;

      const offset = (page - 1) * limit;
      const dataSql = `
            SELECT * FROM products 
            ${whereClause}
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        `;

      const products = await database.query<Product>(dataSql, [
        ...params,
        limit,
        offset,
      ]);

      const response: PaginatedResponse<Product> = {
        success: true,
        data: products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
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

      const product = await database.get<Product>(
        "SELECT * FROM products WHERE id = ?",
        [id]
      );

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

      const existingProduct = await database.get<Product>(
        "SELECT * FROM products WHERE id = ?",
        [id]
      );

      if (!existingProduct) {
        throw new ApiError("Product not found", 404);
      }

      const updateFields: string[] = [];
      const params: any[] = [];

      if (updateData.name !== undefined) {
        updateFields.push("name = ?");
        params.push(updateData.name);
      }

      if (updateData.description !== undefined) {
        updateFields.push("description = ?");
        params.push(updateData.description);
      }

      if (updateData.price !== undefined) {
        updateFields.push("price = ?");
        params.push(updateData.price);
      }

      if (updateData.category !== undefined) {
        updateFields.push("category = ?");
        params.push(updateData.category);
      }

      if (updateData.stock_quantity !== undefined) {
        updateFields.push("stock_quantity = ?");
        params.push(updateData.stock_quantity);
      }

      if (updateData.is_active !== undefined) {
        updateFields.push("is_active = ?");
        params.push(updateData.is_active ? 1 : 0);
      }

      updateFields.push("updated_at = CURRENT_TIMESTAMP");
      params.push(id);

      const sql = `
            UPDATE products 
            SET ${updateFields.join(", ")} 
            WHERE id = ?
        `;

      const result = await database.run(sql, params);

      if (result.changes === 0) {
        throw new ApiError("Failed to update product", 500);
      }

      const updatedProduct = await database.get<Product>(
        "SELECT * FROM products WHERE id = ?",
        [id]
      );

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

      const existingProduct = await database.get<Product>(
        "SELECT * FROM products WHERE id = ?",
        [id]
      );

      if (!existingProduct) {
        throw new ApiError("Product not found", 404);
      }

      const result = await database.run("DELETE FROM products WHERE id = ?", [
        id,
      ]);

      if (result.changes === 0) {
        throw new ApiError("Failed to delete product", 500);
      }

      const response: ApiResponse = {
        success: true,
        message: "Product deleted successfully",
      };

      res.json(response);
    }
  );
}
