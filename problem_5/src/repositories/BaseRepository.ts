import { database } from "../database/connection";
import { ApiError } from "../middleware/errorHandler";

export abstract class BaseRepository<T> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  async findById(id: number): Promise<T | null> {
    try {
      const result = await database.get<T>(
        `SELECT * FROM ${this.tableName} WHERE id = ?`,
        [id]
      );
      return result || null;
    } catch (error) {
      throw new ApiError(
        `Error finding ${this.tableName} by ID: ${error}`,
        500
      );
    }
  }

  async findAll(
    whereClause: string = "",
    params: any[] = [],
    orderBy: string = "created_at DESC",
    limit?: number,
    offset?: number
  ): Promise<T[]> {
    try {
      let sql = `SELECT * FROM ${this.tableName}`;

      if (whereClause) {
        sql += ` WHERE ${whereClause}`;
      }

      if (orderBy) {
        sql += ` ORDER BY ${orderBy}`;
      }

      if (limit !== undefined) {
        sql += ` LIMIT ?`;
        params.push(limit);

        if (offset !== undefined) {
          sql += ` OFFSET ?`;
          params.push(offset);
        }
      }

      return await database.query<T>(sql, params);
    } catch (error) {
      throw new ApiError(
        `Error finding ${this.tableName} records: ${error}`,
        500
      );
    }
  }

  async count(whereClause: string = "", params: any[] = []): Promise<number> {
    try {
      let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;

      if (whereClause) {
        sql += ` WHERE ${whereClause}`;
      }

      const result = await database.get<{ count: number }>(sql, params);
      return result?.count || 0;
    } catch (error) {
      throw new ApiError(
        `Error counting ${this.tableName} records: ${error}`,
        500
      );
    }
  }

  async create(data: Partial<T>, fields: string[]): Promise<T> {
    try {
      const placeholders = fields.map(() => "?").join(", ");
      const values = fields.map((field) => (data as any)[field]);

      const sql = `
                INSERT INTO ${this.tableName} (${fields.join(", ")}) 
                VALUES (${placeholders})
            `;

      const result = await database.run(sql, values);

      if (!result.lastID) {
        throw new ApiError(`Failed to create ${this.tableName} record`, 500);
      }

      const created = await this.findById(result.lastID);
      if (!created) {
        throw new ApiError(
          `Failed to retrieve created ${this.tableName} record`,
          500
        );
      }

      return created;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        `Error creating ${this.tableName} record: ${error}`,
        500
      );
    }
  }

  async update(
    id: number,
    data: Partial<T>,
    fields: string[]
  ): Promise<T | null> {
    try {
      const existing = await this.findById(id);
      if (!existing) {
        return null;
      }

      const setClause = fields.map((field) => `${field} = ?`).join(", ");
      const values = fields.map((field) => (data as any)[field]);
      values.push(id);

      const sql = `
                UPDATE ${this.tableName} 
                SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            `;

      const result = await database.run(sql, values);

      if (result.changes === 0) {
        throw new ApiError(`Failed to update ${this.tableName} record`, 500);
      }

      return await this.findById(id);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        `Error updating ${this.tableName} record: ${error}`,
        500
      );
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const existing = await this.findById(id);
      if (!existing) {
        return false;
      }

      const result = await database.run(
        `DELETE FROM ${this.tableName} WHERE id = ?`,
        [id]
      );

      return result.changes > 0;
    } catch (error) {
      throw new ApiError(
        `Error deleting ${this.tableName} record: ${error}`,
        500
      );
    }
  }

  async exists(id: number): Promise<boolean> {
    try {
      const result = await database.get<{ count: number }>(
        `SELECT COUNT(*) as count FROM ${this.tableName} WHERE id = ?`,
        [id]
      );
      return (result?.count || 0) > 0;
    } catch (error) {
      throw new ApiError(
        `Error checking ${this.tableName} existence: ${error}`,
        500
      );
    }
  }

  async findWithPagination(
    page: number = 1,
    limit: number = 10,
    whereClause: string = "",
    params: any[] = [],
    orderBy: string = "created_at DESC"
  ): Promise<{
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const offset = (page - 1) * limit;

      // Get total count
      const total = await this.count(whereClause, params);

      // Get paginated data
      const data = await this.findAll(
        whereClause,
        params,
        orderBy,
        limit,
        offset
      );

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new ApiError(
        `Error finding ${this.tableName} with pagination: ${error}`,
        500
      );
    }
  }

  protected async executeQuery<R = any>(
    sql: string,
    params: any[] = []
  ): Promise<R[]> {
    try {
      return await database.query<R>(sql, params);
    } catch (error) {
      throw new ApiError(`Error executing query: ${error}`, 500);
    }
  }

  protected async executeQuerySingle<R = any>(
    sql: string,
    params: any[] = []
  ): Promise<R | null> {
    try {
      const result = await database.get<R>(sql, params);
      return result || null;
    } catch (error) {
      throw new ApiError(`Error executing single query: ${error}`, 500);
    }
  }

  protected async executeCommand(
    sql: string,
    params: any[] = []
  ): Promise<{ lastID?: number; changes: number }> {
    try {
      return await database.run(sql, params);
    } catch (error) {
      throw new ApiError(`Error executing command: ${error}`, 500);
    }
  }
}
