import { BaseRepository } from "./BaseRepository";
import {
  User,
  UserFilters,
  CreateUserRequest,
  UpdateUserRequest,
} from "../types";
import { ApiError } from "../middleware/errorHandler";

export type CreateUserData = CreateUserRequest;
export type UpdateUserData = UpdateUserRequest;

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super("users");
  }

  async createUser(userData: CreateUserData): Promise<User> {
    try {
      // Check if email already exists
      const existingUser = await this.findByEmail(userData.email);
      if (existingUser) {
        throw new ApiError("Email already exists", 400);
      }

      const fields = ["name", "email", "age", "status"];
      const data = {
        ...userData,
        status: userData.status || "active",
      };

      return await this.create(data, fields);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(`Error creating user: ${error}`, 500);
    }
  }

  async updateUser(id: number, userData: UpdateUserData): Promise<User | null> {
    try {
      // If email is being updated, check for conflicts
      if (userData.email) {
        const existingUser = await this.findByEmail(userData.email);
        if (existingUser && existingUser.id !== id) {
          throw new ApiError("Email already exists", 400);
        }
      }

      const fields = Object.keys(userData).filter(
        (key) => userData[key as keyof UpdateUserData] !== undefined
      );

      if (fields.length === 0) {
        throw new ApiError("No valid fields to update", 400);
      }

      return await this.update(id, userData, fields);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(`Error updating user: ${error}`, 500);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.executeQuerySingle<User>(
        "SELECT * FROM users WHERE email = ?",
        [email]
      );
    } catch (error) {
      throw new ApiError(`Error finding user by email: ${error}`, 500);
    }
  }

  async findUsersWithFilters(
    filters: UserFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    data: User[];
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
      throw new ApiError(`Error finding users with filters: ${error}`, 500);
    }
  }

  async findByStatus(status: "active" | "inactive"): Promise<User[]> {
    try {
      return await this.executeQuery<User>(
        "SELECT * FROM users WHERE status = ? ORDER BY created_at DESC",
        [status]
      );
    } catch (error) {
      throw new ApiError(`Error finding users by status: ${error}`, 500);
    }
  }

  async findByAgeRange(minAge?: number, maxAge?: number): Promise<User[]> {
    try {
      let sql = "SELECT * FROM users WHERE 1=1";
      const params: any[] = [];

      if (minAge !== undefined) {
        sql += " AND age >= ?";
        params.push(minAge);
      }

      if (maxAge !== undefined) {
        sql += " AND age <= ?";
        params.push(maxAge);
      }

      sql += " ORDER BY age ASC";

      return await this.executeQuery<User>(sql, params);
    } catch (error) {
      throw new ApiError(`Error finding users by age range: ${error}`, 500);
    }
  }

  async searchByName(name: string): Promise<User[]> {
    try {
      return await this.executeQuery<User>(
        "SELECT * FROM users WHERE name LIKE ? ORDER BY name ASC",
        [`%${name}%`]
      );
    } catch (error) {
      throw new ApiError(`Error searching users by name: ${error}`, 500);
    }
  }

  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    averageAge: number;
  }> {
    try {
      const totalResult = await this.executeQuerySingle<{ count: number }>(
        "SELECT COUNT(*) as count FROM users"
      );

      const activeResult = await this.executeQuerySingle<{ count: number }>(
        "SELECT COUNT(*) as count FROM users WHERE status = ?",
        ["active"]
      );

      const inactiveResult = await this.executeQuerySingle<{ count: number }>(
        "SELECT COUNT(*) as count FROM users WHERE status = ?",
        ["inactive"]
      );

      const avgAgeResult = await this.executeQuerySingle<{ avg_age: number }>(
        "SELECT AVG(age) as avg_age FROM users WHERE age IS NOT NULL"
      );

      return {
        total: totalResult?.count || 0,
        active: activeResult?.count || 0,
        inactive: inactiveResult?.count || 0,
        averageAge: Math.round(avgAgeResult?.avg_age || 0),
      };
    } catch (error) {
      throw new ApiError(`Error getting user statistics: ${error}`, 500);
    }
  }

  async softDelete(id: number): Promise<boolean> {
    try {
      const result = await this.executeCommand(
        "UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        ["inactive", id]
      );

      return result.changes > 0;
    } catch (error) {
      throw new ApiError(`Error soft deleting user: ${error}`, 500);
    }
  }

  async reactivate(id: number): Promise<boolean> {
    try {
      const result = await this.executeCommand(
        "UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        ["active", id]
      );

      return result.changes > 0;
    } catch (error) {
      throw new ApiError(`Error reactivating user: ${error}`, 500);
    }
  }

  private buildWhereClause(filters: UserFilters): {
    whereClause: string;
    params: any[];
  } {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.name) {
      conditions.push("name LIKE ?");
      params.push(`%${filters.name}%`);
    }

    if (filters.email) {
      conditions.push("email LIKE ?");
      params.push(`%${filters.email}%`);
    }

    if (filters.status) {
      conditions.push("status = ?");
      params.push(filters.status);
    }

    if (filters.age_min !== undefined) {
      conditions.push("age >= ?");
      params.push(filters.age_min);
    }

    if (filters.age_max !== undefined) {
      conditions.push("age <= ?");
      params.push(filters.age_max);
    }

    const whereClause = conditions.length > 0 ? conditions.join(" AND ") : "";

    return { whereClause, params };
  }
}
