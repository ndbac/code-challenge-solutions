import { migrationRunner } from "./migrationRunner";

export class DatabaseSchema {
  async initializeTables(): Promise<void> {
    try {
      await migrationRunner.runMigrations();
      console.log("Database schema initialized successfully via migrations");
    } catch (error) {
      console.error("Error initializing database schema:", error);
      throw error;
    }
  }

  async getMigrationStatus(): Promise<{
    executed: string[];
    pending: string[];
  }> {
    return await migrationRunner.getMigrationStatus();
  }

  async rollbackLastMigration(): Promise<void> {
    await migrationRunner.rollbackLastMigration();
  }

  createMigration(name: string): string {
    return migrationRunner.createMigrationFile(name);
  }
}

export const databaseSchema = new DatabaseSchema();
