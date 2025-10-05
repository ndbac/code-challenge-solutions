import { ProductRepository } from "../../src/repositories/ProductRepository";
import { ApiError } from "../../src/middleware/errorHandler";
import { mockDatabase, createMockDbResponse } from "../setup";

describe("ProductRepository", () => {
  let productRepository: ProductRepository;

  beforeEach(() => {
    productRepository = new ProductRepository();
  });

  describe("createProduct", () => {
    it("should create a product successfully", async () => {
      const productData = {
        name: "Test Product",
        description: "Test Description",
        price: 99.99,
        category: "Electronics",
        stock_quantity: 10,
        is_active: true,
      };

      const mockCreatedProduct = createMockDbResponse.product(productData);

      mockDatabase.run.mockResolvedValue(createMockDbResponse.runResult());
      mockDatabase.get.mockResolvedValue(mockCreatedProduct);

      const result = await productRepository.createProduct(productData);

      expect(result).toEqual(mockCreatedProduct);
      expect(mockDatabase.run).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO products"),
        expect.arrayContaining([
          "Test Product",
          "Test Description",
          99.99,
          "Electronics",
          10,
          true,
        ])
      );
    });

    it("should set default is_active to true when not provided", async () => {
      const productData = {
        name: "Test Product",
        price: 99.99,
      };

      const mockCreatedProduct = createMockDbResponse.product({
        ...productData,
        is_active: true,
      });

      mockDatabase.run.mockResolvedValue(createMockDbResponse.runResult());
      mockDatabase.get.mockResolvedValue(mockCreatedProduct);

      const result = await productRepository.createProduct(productData);

      expect(result.is_active).toBe(true);
    });

    it("should handle database errors", async () => {
      const productData = { name: "Test Product", price: 99.99 };

      mockDatabase.run.mockRejectedValue(new Error("Database error"));

      await expect(
        productRepository.createProduct(productData)
      ).rejects.toThrow(ApiError);
    });
  });

  describe("updateProduct", () => {
    it("should update product successfully", async () => {
      const updateData = { name: "Updated Product", price: 149.99 };
      const mockUpdatedProduct = createMockDbResponse.product(updateData);

      mockDatabase.get
        .mockResolvedValueOnce(createMockDbResponse.product()) // existing product check
        .mockResolvedValueOnce(mockUpdatedProduct); // updated product
      mockDatabase.run.mockResolvedValue(createMockDbResponse.runResult());

      const result = await productRepository.updateProduct(1, updateData);

      expect(result).toEqual(mockUpdatedProduct);
    });

    it("should throw error when no valid fields to update", async () => {
      await expect(productRepository.updateProduct(1, {})).rejects.toThrow(
        new ApiError("No valid fields to update", 400)
      );
    });

    it("should handle database errors", async () => {
      const updateData = { name: "Updated Product" };

      mockDatabase.get.mockRejectedValue(new Error("Database error"));

      await expect(
        productRepository.updateProduct(1, updateData)
      ).rejects.toThrow(ApiError);
    });
  });

  describe("findProductsWithFilters", () => {
    it("should find products with filters and pagination", async () => {
      const filters = {
        category: "Electronics",
        price_min: 50,
        price_max: 200,
      };
      const mockProducts = [
        createMockDbResponse.product(),
        createMockDbResponse.product({ id: 2 }),
      ];

      mockDatabase.get.mockResolvedValue(createMockDbResponse.countResult(2));
      mockDatabase.query.mockResolvedValue(mockProducts);

      const result = await productRepository.findProductsWithFilters(
        filters,
        1,
        10
      );

      expect(result).toEqual({
        data: mockProducts,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it("should handle database errors", async () => {
      const filters = { category: "Electronics" };

      mockDatabase.get.mockRejectedValue(new Error("Database error"));

      await expect(
        productRepository.findProductsWithFilters(filters)
      ).rejects.toThrow(ApiError);
    });
  });

  describe("findByCategory", () => {
    it("should find products by category", async () => {
      const mockProducts = [
        createMockDbResponse.product({ category: "Electronics" }),
      ];
      mockDatabase.query.mockResolvedValue(mockProducts);

      const result = await productRepository.findByCategory("Electronics");

      expect(result).toEqual(mockProducts);
      expect(mockDatabase.query).toHaveBeenCalledWith(
        "SELECT * FROM products WHERE category = ? ORDER BY name ASC",
        ["Electronics"]
      );
    });
  });

  describe("findByPriceRange", () => {
    it("should find products by price range with both min and max", async () => {
      const mockProducts = [createMockDbResponse.product({ price: 100 })];
      mockDatabase.query.mockResolvedValue(mockProducts);

      const result = await productRepository.findByPriceRange(50, 150);

      expect(result).toEqual(mockProducts);
      expect(mockDatabase.query).toHaveBeenCalledWith(
        "SELECT * FROM products WHERE 1=1 AND price >= ? AND price <= ? ORDER BY price ASC",
        [50, 150]
      );
    });

    it("should find products by minimum price only", async () => {
      const mockProducts = [createMockDbResponse.product({ price: 100 })];
      mockDatabase.query.mockResolvedValue(mockProducts);

      const result = await productRepository.findByPriceRange(50);

      expect(result).toEqual(mockProducts);
      expect(mockDatabase.query).toHaveBeenCalledWith(
        "SELECT * FROM products WHERE 1=1 AND price >= ? ORDER BY price ASC",
        [50]
      );
    });
  });

  describe("findActiveProducts", () => {
    it("should find active products", async () => {
      const mockProducts = [createMockDbResponse.product({ is_active: true })];
      mockDatabase.query.mockResolvedValue(mockProducts);

      const result = await productRepository.findActiveProducts();

      expect(result).toEqual(mockProducts);
      expect(mockDatabase.query).toHaveBeenCalledWith(
        "SELECT * FROM products WHERE is_active = 1 ORDER BY created_at DESC",
        []
      );
    });
  });

  describe("findLowStockProducts", () => {
    it("should find low stock products with default threshold", async () => {
      const mockProducts = [
        createMockDbResponse.product({ stock_quantity: 5 }),
      ];
      mockDatabase.query.mockResolvedValue(mockProducts);

      const result = await productRepository.findLowStockProducts();

      expect(result).toEqual(mockProducts);
      expect(mockDatabase.query).toHaveBeenCalledWith(
        "SELECT * FROM products WHERE stock_quantity <= ? AND is_active = 1 ORDER BY stock_quantity ASC",
        [10]
      );
    });

    it("should find low stock products with custom threshold", async () => {
      const mockProducts = [
        createMockDbResponse.product({ stock_quantity: 3 }),
      ];
      mockDatabase.query.mockResolvedValue(mockProducts);

      const result = await productRepository.findLowStockProducts(5);

      expect(result).toEqual(mockProducts);
      expect(mockDatabase.query).toHaveBeenCalledWith(
        "SELECT * FROM products WHERE stock_quantity <= ? AND is_active = 1 ORDER BY stock_quantity ASC",
        [5]
      );
    });
  });

  describe("searchByName", () => {
    it("should search products by name", async () => {
      const mockProducts = [
        createMockDbResponse.product({ name: "Test Product" }),
      ];
      mockDatabase.query.mockResolvedValue(mockProducts);

      const result = await productRepository.searchByName("Test");

      expect(result).toEqual(mockProducts);
      expect(mockDatabase.query).toHaveBeenCalledWith(
        "SELECT * FROM products WHERE name LIKE ? ORDER BY name ASC",
        ["%Test%"]
      );
    });
  });

  describe("getProductStats", () => {
    it("should return product statistics", async () => {
      const mockCategories = [
        { category: "Electronics", count: 10 },
        { category: "Books", count: 5 },
      ];

      mockDatabase.get
        .mockResolvedValueOnce(createMockDbResponse.countResult(50)) // total
        .mockResolvedValueOnce(createMockDbResponse.countResult(40)) // active
        .mockResolvedValueOnce(createMockDbResponse.countResult(10)) // inactive
        .mockResolvedValueOnce({ avg_price: 125.75 }) // average price
        .mockResolvedValueOnce({ total_value: 5000.5 }); // total value

      mockDatabase.query.mockResolvedValue(mockCategories);

      const result = await productRepository.getProductStats();

      expect(result).toEqual({
        total: 50,
        active: 40,
        inactive: 10,
        categories: mockCategories,
        averagePrice: 125.75,
        totalValue: 5000.5,
      });
    });
  });

  describe("updateStock", () => {
    it("should update product stock successfully", async () => {
      const mockUpdatedProduct = createMockDbResponse.product({
        stock_quantity: 20,
      });

      mockDatabase.run.mockResolvedValue(createMockDbResponse.runResult());
      mockDatabase.get.mockResolvedValue(mockUpdatedProduct);

      const result = await productRepository.updateStock(1, 20);

      expect(result).toEqual(mockUpdatedProduct);
      expect(mockDatabase.run).toHaveBeenCalledWith(
        "UPDATE products SET stock_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [20, 1]
      );
    });

    it("should throw error for negative stock quantity", async () => {
      await expect(productRepository.updateStock(1, -5)).rejects.toThrow(
        new ApiError("Stock quantity cannot be negative", 400)
      );
    });

    it("should return null when product not found", async () => {
      mockDatabase.run.mockResolvedValue({ changes: 0 });

      const result = await productRepository.updateStock(999, 10);

      expect(result).toBeNull();
    });
  });

  describe("deactivate", () => {
    it("should deactivate product successfully", async () => {
      mockDatabase.run.mockResolvedValue(createMockDbResponse.runResult());

      const result = await productRepository.deactivate(1);

      expect(result).toBe(true);
      expect(mockDatabase.run).toHaveBeenCalledWith(
        "UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [1]
      );
    });

    it("should return false when no changes made", async () => {
      mockDatabase.run.mockResolvedValue({ changes: 0 });

      const result = await productRepository.deactivate(999);

      expect(result).toBe(false);
    });
  });

  describe("activate", () => {
    it("should activate product successfully", async () => {
      mockDatabase.run.mockResolvedValue(createMockDbResponse.runResult());

      const result = await productRepository.activate(1);

      expect(result).toBe(true);
      expect(mockDatabase.run).toHaveBeenCalledWith(
        "UPDATE products SET is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [1]
      );
    });
  });

  describe("getCategories", () => {
    it("should return list of unique categories", async () => {
      const mockCategoryResults = [
        { category: "Electronics" },
        { category: "Books" },
        { category: "Clothing" },
      ];

      mockDatabase.query.mockResolvedValue(mockCategoryResults);

      const result = await productRepository.getCategories();

      expect(result).toEqual(["Electronics", "Books", "Clothing"]);
      expect(mockDatabase.query).toHaveBeenCalledWith(
        "SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category ASC",
        []
      );
    });
  });
});
