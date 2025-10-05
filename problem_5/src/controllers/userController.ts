import { Request, Response } from "express";
import { userRepository } from "../repositories";
import { ApiError, asyncHandler } from "../middleware/errorHandler";
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  ApiResponse,
  PaginatedResponse,
  UserFilters,
} from "../types";

export class UserController {
  static createUser = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userData: CreateUserRequest = req.body;

      const createdUser = await userRepository.createUser({
        name: userData.name,
        email: userData.email,
        age: userData.age,
        status: userData.status || "active",
      });

      const response: ApiResponse<User> = {
        success: true,
        data: createdUser,
        message: "User created successfully",
      };

      res.status(201).json(response);
    }
  );

  static getUsers = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const filters: UserFilters = {
        name: req.query.name as string,
        email: req.query.email as string,
        status: req.query.status as "active" | "inactive",
        age_min: req.query.age_min
          ? parseInt(req.query.age_min as string)
          : undefined,
        age_max: req.query.age_max
          ? parseInt(req.query.age_max as string)
          : undefined,
      };

      const result = await userRepository.findUsersWithFilters(
        filters,
        page,
        limit
      );

      const response: PaginatedResponse<User> = {
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

  static getUserById = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        throw new ApiError("Invalid user ID", 400);
      }

      const user = await userRepository.findById(Number(id));

      if (!user) {
        throw new ApiError("User not found", 404);
      }

      const response: ApiResponse<User> = {
        success: true,
        data: user,
      };

      res.json(response);
    }
  );

  static updateUser = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;
      const updateData: UpdateUserRequest = req.body;

      if (!id || isNaN(Number(id))) {
        throw new ApiError("Invalid user ID", 400);
      }

      const updatedUser = await userRepository.updateUser(Number(id), {
        name: updateData.name,
        email: updateData.email,
        age: updateData.age,
        status: updateData.status,
      });

      if (!updatedUser) {
        throw new ApiError("User not found", 404);
      }

      const response: ApiResponse<User> = {
        success: true,
        data: updatedUser,
        message: "User updated successfully",
      };

      res.json(response);
    }
  );

  static deleteUser = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        throw new ApiError("Invalid user ID", 400);
      }

      const deleted = await userRepository.delete(Number(id));

      if (!deleted) {
        throw new ApiError("User not found", 404);
      }

      const response: ApiResponse = {
        success: true,
        message: "User deleted successfully",
      };

      res.json(response);
    }
  );
}
