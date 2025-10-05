import { Request, Response } from "express";
import { database } from "../database/connection";
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

      const sql = `
            INSERT INTO users (name, email, age, status) 
            VALUES (?, ?, ?, ?)
        `;

      const params = [
        userData.name,
        userData.email,
        userData.age || null,
        userData.status || "active",
      ];

      const result = await database.run(sql, params);

      if (!result.lastID) {
        throw new ApiError("Failed to create user", 500);
      }

      const createdUser = await database.get<User>(
        "SELECT * FROM users WHERE id = ?",
        [result.lastID]
      );

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

      const whereConditions: string[] = [];
      const params: any[] = [];

      if (filters.name) {
        whereConditions.push("name LIKE ?");
        params.push(`%${filters.name}%`);
      }

      if (filters.email) {
        whereConditions.push("email LIKE ?");
        params.push(`%${filters.email}%`);
      }

      if (filters.status) {
        whereConditions.push("status = ?");
        params.push(filters.status);
      }

      if (filters.age_min) {
        whereConditions.push("age >= ?");
        params.push(filters.age_min);
      }

      if (filters.age_max) {
        whereConditions.push("age <= ?");
        params.push(filters.age_max);
      }

      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(" AND ")}`
          : "";

      const countSql = `SELECT COUNT(*) as count FROM users ${whereClause}`;
      const countResult = await database.get<{ count: number }>(
        countSql,
        params
      );
      const total = countResult?.count || 0;

      const offset = (page - 1) * limit;
      const dataSql = `
            SELECT * FROM users 
            ${whereClause}
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        `;

      const users = await database.query<User>(dataSql, [
        ...params,
        limit,
        offset,
      ]);

      const response: PaginatedResponse<User> = {
        success: true,
        data: users,
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

  static getUserById = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        throw new ApiError("Invalid user ID", 400);
      }

      const user = await database.get<User>(
        "SELECT * FROM users WHERE id = ?",
        [id]
      );

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

      const existingUser = await database.get<User>(
        "SELECT * FROM users WHERE id = ?",
        [id]
      );

      if (!existingUser) {
        throw new ApiError("User not found", 404);
      }

      const updateFields: string[] = [];
      const params: any[] = [];

      if (updateData.name !== undefined) {
        updateFields.push("name = ?");
        params.push(updateData.name);
      }

      if (updateData.email !== undefined) {
        updateFields.push("email = ?");
        params.push(updateData.email);
      }

      if (updateData.age !== undefined) {
        updateFields.push("age = ?");
        params.push(updateData.age);
      }

      if (updateData.status !== undefined) {
        updateFields.push("status = ?");
        params.push(updateData.status);
      }

      updateFields.push("updated_at = CURRENT_TIMESTAMP");
      params.push(id);

      const sql = `
            UPDATE users 
            SET ${updateFields.join(", ")} 
            WHERE id = ?
        `;

      const result = await database.run(sql, params);

      if (result.changes === 0) {
        throw new ApiError("Failed to update user", 500);
      }

      const updatedUser = await database.get<User>(
        "SELECT * FROM users WHERE id = ?",
        [id]
      );

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

      const existingUser = await database.get<User>(
        "SELECT * FROM users WHERE id = ?",
        [id]
      );

      if (!existingUser) {
        throw new ApiError("User not found", 404);
      }

      const result = await database.run("DELETE FROM users WHERE id = ?", [id]);

      if (result.changes === 0) {
        throw new ApiError("Failed to delete user", 500);
      }

      const response: ApiResponse = {
        success: true,
        message: "User deleted successfully",
      };

      res.json(response);
    }
  );
}
