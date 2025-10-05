import { Request, Response } from "express";
import { UserController } from "../../src/controllers/userController";
import { userRepository } from "../../src/repositories";
import { ApiError } from "../../src/middleware/errorHandler";
import { createMockDbResponse } from "../setup";

// Mock the repository
jest.mock("../../src/repositories", () => ({
  userRepository: {
    createUser: jest.fn(),
    findUsersWithFilters: jest.fn(),
    findById: jest.fn(),
    updateUser: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockUserRepository = userRepository as jest.Mocked<typeof userRepository>;

describe("UserController", () => {
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

  describe("createUser", () => {
    it("should create a user successfully", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        age: 30,
        status: "active" as const,
      };

      const mockCreatedUser = createMockDbResponse.user(userData);
      mockUserRepository.createUser.mockResolvedValue(mockCreatedUser);

      mockRequest.body = userData;

      await UserController.createUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockUserRepository.createUser).toHaveBeenCalledWith({
        name: "John Doe",
        email: "john@example.com",
        age: 30,
        status: "active",
      });

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockCreatedUser,
        message: "User created successfully",
      });
    });

    it("should create user with default status when not provided", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        age: 30,
      };

      const mockCreatedUser = createMockDbResponse.user({
        ...userData,
        status: "active",
      });
      mockUserRepository.createUser.mockResolvedValue(mockCreatedUser);

      mockRequest.body = userData;

      await UserController.createUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockUserRepository.createUser).toHaveBeenCalledWith({
        name: "John Doe",
        email: "john@example.com",
        age: 30,
        status: "active",
      });
    });
  });

  describe("getUsers", () => {
    it("should get users with default pagination", async () => {
      const mockUsers = [
        createMockDbResponse.user(),
        createMockDbResponse.user({ id: 2 }),
      ];
      const mockResult = {
        data: mockUsers,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockUserRepository.findUsersWithFilters.mockResolvedValue(mockResult);
      mockRequest.query = {};

      await UserController.getUsers(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockUserRepository.findUsersWithFilters).toHaveBeenCalledWith(
        {
          name: undefined,
          email: undefined,
          status: undefined,
          age_min: undefined,
          age_max: undefined,
        },
        1,
        10
      );

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockUsers,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      });
    });

    it("should get users with filters and custom pagination", async () => {
      const mockUsers = [
        createMockDbResponse.user({ status: "active", age: 25 }),
      ];
      const mockResult = {
        data: mockUsers,
        total: 1,
        page: 2,
        limit: 5,
        totalPages: 1,
      };

      mockUserRepository.findUsersWithFilters.mockResolvedValue(mockResult);
      mockRequest.query = {
        page: "2",
        limit: "5",
        status: "active",
        age_min: "18",
        age_max: "65",
        name: "John",
        email: "john",
      };

      await UserController.getUsers(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockUserRepository.findUsersWithFilters).toHaveBeenCalledWith(
        {
          name: "John",
          email: "john",
          status: "active",
          age_min: 18,
          age_max: 65,
        },
        2,
        5
      );
    });
  });

  describe("getUserById", () => {
    it("should get user by valid ID", async () => {
      const mockUser = createMockDbResponse.user();
      mockUserRepository.findById.mockResolvedValue(mockUser);

      mockRequest.params = { id: "1" };

      await UserController.getUserById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockUser,
      });
    });
  });

  describe("updateUser", () => {
    it("should update user successfully", async () => {
      const updateData = { name: "Jane Doe", age: 25 };
      const mockUpdatedUser = createMockDbResponse.user(updateData);

      mockUserRepository.updateUser.mockResolvedValue(mockUpdatedUser);

      mockRequest.params = { id: "1" };
      mockRequest.body = updateData;

      await UserController.updateUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockUserRepository.updateUser).toHaveBeenCalledWith(1, updateData);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedUser,
        message: "User updated successfully",
      });
    });
  });

  describe("deleteUser", () => {
    it("should delete user successfully", async () => {
      mockUserRepository.delete.mockResolvedValue(true);

      mockRequest.params = { id: "1" };

      await UserController.deleteUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockUserRepository.delete).toHaveBeenCalledWith(1);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: "User deleted successfully",
      });
    });
  });
});
