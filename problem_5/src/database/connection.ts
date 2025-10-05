import sqlite3 from "sqlite3";
import path from "path";

const sqlite = sqlite3.verbose();

const DB_PATH = path.join(__dirname, "../../data/database.sqlite");

export class Database {
  private db: sqlite3.Database | null = null;

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite.Database(DB_PATH, (err) => {
        if (err) {
          console.error("Error opening database:", err.message);
          reject(err);
        } else {
          console.log("Connected to SQLite database");
          resolve();
        }
      });
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error("Error closing database:", err.message);
            reject(err);
          } else {
            console.log("Database connection closed");
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not connected"));
        return;
      }

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error("Query error:", err.message);
          reject(err);
        } else {
          resolve(rows as T[]);
        }
      });
    });
  }

  async run(
    sql: string,
    params: any[] = []
  ): Promise<{ lastID?: number; changes: number }> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not connected"));
        return;
      }

      this.db.run(sql, params, function (err) {
        if (err) {
          console.error("Run error:", err.message);
          reject(err);
        } else {
          resolve({
            lastID: this.lastID,
            changes: this.changes,
          });
        }
      });
    });
  }

  async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not connected"));
        return;
      }

      this.db.get(sql, params, (err, row) => {
        if (err) {
          console.error("Get error:", err.message);
          reject(err);
        } else {
          resolve(row as T);
        }
      });
    });
  }

  async transaction(
    queries: Array<{ sql: string; params?: any[] }>
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not connected"));
        return;
      }

      this.db.serialize(() => {
        this.db!.run("BEGIN TRANSACTION");

        try {
          queries.forEach(({ sql, params = [] }) => {
            this.db!.run(sql, params);
          });

          this.db!.run("COMMIT", (err) => {
            if (err) {
              this.db!.run("ROLLBACK");
              reject(err);
            } else {
              resolve();
            }
          });
        } catch (error) {
          this.db!.run("ROLLBACK");
          reject(error);
        }
      });
    });
  }
}

export const database = new Database();
