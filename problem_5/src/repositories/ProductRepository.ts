import { BaseRepository } from "./BaseRepository";
import {
  Product,
  ProductFilters,
  CreateProductRequest,
  UpdateProductRequest,
} from "../types";
import { ApiError } from "../middleware/errorHandler";

export type CreateProductData = CreateProductRequest;
export type UpdateProductData = UpdateProductRequest;

export class ProductRepository extends BaseRepository<Product> {
  constructor() {
    super("products");
  }

  async createProduct(productData: CreateProductData): Promise<Product> {
    try {
      const fields = [
        "name",
        "description",
        "price",
        "category",
        "stock_quantity",
        "is_active",
      ];
      const data = {
        ...productData,
        is_active:
          productData.is_active !== undefined ? productData.is_active : true,
      };

      return await this.create(data, fields);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(`Error creating product: ${error}`, 500);
    }
  }

  async updateProduct(
    id: number,
    productData: UpdateProductData
  ): Promise<Product | null> {
    try {
      const fields = Object.keys(productData).filter(
        (key) => productData[key as keyof UpdateProductData] !== undefined
      );

      if (fields.length === 0) {
        throw new ApiError("No valid fields to update", 400);
      }

      return await this.update(id, productData, fields);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(`Error updating product: ${error}`, 500);
    }
  }

  async findProductsWithFilters(
    filters: ProductFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    data: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const { whereClause, params } = this.buildWhereClause(filters);

      return await this.findWithPagination(
        page,
        limit,
        whereClause,
        params,
        "created_at DESC"
      );
    } catch (error) {
      throw new ApiError(`Error finding products with filters: ${error}`, 500);
    }
  }

  async findByCategory(category: string): Promise<Product[]> {
    try {
      return await this.executeQuery<Product>(
        "SELECT * FROM products WHERE category = ? ORDER BY name ASC",
        [category]
      );
    } catch (error) {
      throw new ApiError(`Error finding products by category: ${error}`, 500);
    }
  }

  async findByPriceRange(
    minPrice?: number,
    maxPrice?: number
  ): Promise<Product[]> {
    try {
      let sql = "SELECT * FROM products WHERE 1=1";
      const params: any[] = [];

      if (minPrice !== undefined) {
        sql += " AND price >= ?";
        params.push(minPrice);
      }

      if (maxPrice !== undefined) {
        sql += " AND price <= ?";
        params.push(maxPrice);
      }

      sql += " ORDER BY price ASC";

      return await this.executeQuery<Product>(sql, params);
    } catch (error) {
      throw new ApiError(
        `Error finding products by price range: ${error}`,
        500
      );
    }
  }

  async findActiveProducts(): Promise<Product[]> {
    try {
      return await this.executeQuery<Product>(
        "SELECT * FROM products WHERE is_active = 1 ORDER BY created_at DESC"
      );
    } catch (error) {
      throw new ApiError(`Error finding active products: ${error}`, 500);
    }
  }

  async findLowStockProducts(threshold: number = 10): Promise<Product[]> {
    try {
      return await this.executeQuery<Product>(
        "SELECT * FROM products WHERE stock_quantity <= ? AND is_active = 1 ORDER BY stock_quantity ASC",
        [threshold]
      );
    } catch (error) {
      throw new ApiError(`Error finding low stock products: ${error}`, 500);
    }
  }

  async searchByName(name: string): Promise<Product[]> {
    try {
      return await this.executeQuery<Product>(
        "SELECT * FROM products WHERE name LIKE ? ORDER BY name ASC",
        [`%${name}%`]
      );
    } catch (error) {
      throw new ApiError(`Error searching products by name: ${error}`, 500);
    }
  }

  async getProductStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    categories: { category: string; count: number }[];
    averagePrice: number;
    totalValue: number;
  }> {
    try {
      const totalResult = await this.executeQuerySingle<{ count: number }>(
        "SELECT COUNT(*) as count FROM products"
      );

      const activeResult = await this.executeQuerySingle<{ count: number }>(
        "SELECT COUNT(*) as count FROM products WHERE is_active = 1"
      );

      const inactiveResult = await this.executeQuerySingle<{ count: number }>(
        "SELECT COUNT(*) as count FROM products WHERE is_active = 0"
      );

      const categoriesResult = await this.executeQuery<{
        category: string;
        count: number;
      }>(
        "SELECT category, COUNT(*) as count FROM products GROUP BY category ORDER BY count DESC"
      );

      const avgPriceResult = await this.executeQuerySingle<{
        avg_price: number;
      }>("SELECT AVG(price) as avg_price FROM products WHERE is_active = 1");

      const totalValueResult = await this.executeQuerySingle<{
        total_value: number;
      }>(
        "SELECT SUM(price * stock_quantity) as total_value FROM products WHERE is_active = 1"
      );

      return {
        total: totalResult?.count || 0,
        active: activeResult?.count || 0,
        inactive: inactiveResult?.count || 0,
        categories: categoriesResult || [],
        averagePrice: Math.round((avgPriceResult?.avg_price || 0) * 100) / 100,
        totalValue:
          Math.round((totalValueResult?.total_value || 0) * 100) / 100,
      };
    } catch (error) {
      throw new ApiError(`Error getting product statistics: ${error}`, 500);
    }
  }

  async updateStock(id: number, quantity: number): Promise<Product | null> {
    try {
      if (quantity < 0) {
        throw new ApiError("Stock quantity cannot be negative", 400);
      }

      const result = await this.executeCommand(
        "UPDATE products SET stock_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [quantity, id]
      );

      if (result.changes === 0) {
        return null;
      }

      return await this.findById(id);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(`Error updating product stock: ${error}`, 500);
    }
  }

  async deactivate(id: number): Promise<boolean> {
    try {
      const result = await this.executeCommand(
        "UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [id]
      );

      return result.changes > 0;
    } catch (error) {
      throw new ApiError(`Error deactivating product: ${error}`, 500);
    }
  }

  async activate(id: number): Promise<boolean> {
    try {
      const result = await this.executeCommand(
        "UPDATE products SET is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [id]
      );

      return result.changes > 0;
    } catch (error) {
      throw new ApiError(`Error activating product: ${error}`, 500);
    }
  }

  async getCategories(): Promise<string[]> {
    try {
      const result = await this.executeQuery<{ category: string }>(
        "SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category ASC"
      );

      return result.map((row) => row.category);
    } catch (error) {
      throw new ApiError(`Error getting product categories: ${error}`, 500);
    }
  }

  private buildWhereClause(filters: ProductFilters): {
    whereClause: string;
    params: any[];
  } {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.name) {
      conditions.push("name LIKE ?");
      params.push(`%${filters.name}%`);
    }

    if (filters.category) {
      conditions.push("category = ?");
      params.push(filters.category);
    }

    if (filters.price_min !== undefined) {
      conditions.push("price >= ?");
      params.push(filters.price_min);
    }

    if (filters.price_max !== undefined) {
      conditions.push("price <= ?");
      params.push(filters.price_max);
    }

    if (filters.is_active !== undefined) {
      conditions.push("is_active = ?");
      params.push(filters.is_active ? 1 : 0);
    }

    const whereClause = conditions.length > 0 ? conditions.join(" AND ") : "";

    return { whereClause, params };
  }
}
