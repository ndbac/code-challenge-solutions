import { Request, Response } from "express";
import { ProductController } from "../../src/controllers/productController";
import { productRepository } from "../../src/repositories";
import { ApiError } from "../../src/middleware/errorHandler";
import { createMockDbResponse } from "../setup";

// Mock the repository
jest.mock("../../src/repositories", () => ({
  productRepository: {
    createProduct: jest.fn(),
    findProductsWithFilters: jest.fn(),
    findById: jest.fn(),
    updateProduct: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockProductRepository = productRepository as jest.Mocked<
  typeof productRepository
>;

describe("ProductController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockNext = jest.fn();

    mockRequest = {};
    mockResponse = {
      json: mockJson,
      status: mockStatus,
    };
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
      mockProductRepository.createProduct.mockResolvedValue(mockCreatedProduct);

      mockRequest.body = productData;

      await ProductController.createProduct(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockProductRepository.createProduct).toHaveBeenCalledWith({
        name: "Test Product",
        description: "Test Description",
        price: 99.99,
        category: "Electronics",
        stock_quantity: 10,
        is_active: true,
      });

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockCreatedProduct,
        message: "Product created successfully",
      });
    });

    it("should create product with default values when not provided", async () => {
      const productData = {
        name: "Test Product",
        price: 99.99,
      };

      const mockCreatedProduct = createMockDbResponse.product({
        ...productData,
        stock_quantity: 0,
        is_active: true,
      });
      mockProductRepository.createProduct.mockResolvedValue(mockCreatedProduct);

      mockRequest.body = productData;

      await ProductController.createProduct(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockProductRepository.createProduct).toHaveBeenCalledWith({
        name: "Test Product",
        description: undefined,
        price: 99.99,
        category: undefined,
        stock_quantity: 0,
        is_active: true,
      });
    });
  });

  describe("getProducts", () => {
    it("should get products with default pagination", async () => {
      const mockProducts = [
        createMockDbResponse.product(),
        createMockDbResponse.product({ id: 2 }),
      ];
      const mockResult = {
        data: mockProducts,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockProductRepository.findProductsWithFilters.mockResolvedValue(
        mockResult
      );
      mockRequest.query = {};

      await ProductController.getProducts(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(
        mockProductRepository.findProductsWithFilters
      ).toHaveBeenCalledWith(
        {
          name: undefined,
          category: undefined,
          price_min: undefined,
          price_max: undefined,
          is_active: undefined,
        },
        1,
        10
      );

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockProducts,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      });
    });

    it("should get products with filters and custom pagination", async () => {
      const mockProducts = [
        createMockDbResponse.product({ category: "Electronics", price: 150 }),
      ];
      const mockResult = {
        data: mockProducts,
        total: 1,
        page: 2,
        limit: 5,
        totalPages: 1,
      };

      mockProductRepository.findProductsWithFilters.mockResolvedValue(
        mockResult
      );
      mockRequest.query = {
        page: "2",
        limit: "5",
        category: "Electronics",
        price_min: "100",
        price_max: "200",
        name: "Test",
        is_active: "true",
      };

      await ProductController.getProducts(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(
        mockProductRepository.findProductsWithFilters
      ).toHaveBeenCalledWith(
        {
          name: "Test",
          category: "Electronics",
          price_min: 100,
          price_max: 200,
          is_active: true,
        },
        2,
        5
      );
    });

    it("should handle is_active filter correctly", async () => {
      const mockResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };

      mockProductRepository.findProductsWithFilters.mockResolvedValue(
        mockResult
      );

      // Test with 'false'
      mockRequest.query = { is_active: "false" };
      await ProductController.getProducts(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(
        mockProductRepository.findProductsWithFilters
      ).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: false }),
        1,
        10
      );

      // Test with 'true'
      mockRequest.query = { is_active: "true" };
      await ProductController.getProducts(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(
        mockProductRepository.findProductsWithFilters
      ).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: true }),
        1,
        10
      );
    });
  });

  describe("getProductById", () => {
    it("should get product by valid ID", async () => {
      const mockProduct = createMockDbResponse.product();
      mockProductRepository.findById.mockResolvedValue(mockProduct);

      mockRequest.params = { id: "1" };

      await ProductController.getProductById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockProductRepository.findById).toHaveBeenCalledWith(1);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockProduct,
      });
    });
  });

  describe("updateProduct", () => {
    it("should update product successfully", async () => {
      const updateData = { name: "Updated Product", price: 149.99 };
      const mockUpdatedProduct = createMockDbResponse.product(updateData);

      mockProductRepository.updateProduct.mockResolvedValue(mockUpdatedProduct);

      mockRequest.params = { id: "1" };
      mockRequest.body = updateData;

      await ProductController.updateProduct(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockProductRepository.updateProduct).toHaveBeenCalledWith(
        1,
        updateData
      );
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedProduct,
        message: "Product updated successfully",
      });
    });
  });

  describe("deleteProduct", () => {
    it("should delete product successfully", async () => {
      mockProductRepository.delete.mockResolvedValue(true);

      mockRequest.params = { id: "1" };

      await ProductController.deleteProduct(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockProductRepository.delete).toHaveBeenCalledWith(1);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: "Product deleted successfully",
      });
    });
  });
});
