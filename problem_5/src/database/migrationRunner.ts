import { database } from "./connection";
import fs from "fs";
import path from "path";

export interface Migration {
  id: string;
  name: string;
  up: string;
  down: string;
  timestamp: number;
}

export class MigrationRunner {
  private migrationsPath: string;

  constructor() {
    this.migrationsPath = path.join(__dirname, "migrations");
  }

  async initializeMigrationsTable(): Promise<void> {
    const sql = `
            CREATE TABLE IF NOT EXISTS migrations (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;
    await database.run(sql);
    console.log("Migrations table initialized");
  }

  async getExecutedMigrations(): Promise<string[]> {
    const migrations = await database.query<{ id: string }>(
      "SELECT id FROM migrations ORDER BY executed_at ASC"
    );
    return migrations.map((m) => m.id);
  }

  async getAvailableMigrations(): Promise<Migration[]> {
    if (!fs.existsSync(this.migrationsPath)) {
      fs.mkdirSync(this.migrationsPath, { recursive: true });
      return [];
    }

    const files = fs
      .readdirSync(this.migrationsPath)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    const migrations: Migration[] = [];

    for (const file of files) {
      const filePath = path.join(this.migrationsPath, file);
      const content = fs.readFileSync(filePath, "utf8");

      const parts = content.split("-- DOWN");
      if (parts.length !== 2) {
        throw new Error(`Invalid migration file format: ${file}`);
      }

      const upPart = parts[0].replace("-- UP", "").trim();
      const downPart = parts[1].trim();

      const match = file.match(/^(\d+)_(.+)\.sql$/);
      if (!match) {
        throw new Error(`Invalid migration filename format: ${file}`);
      }

      const [, timestamp, name] = match;
      const id = `${timestamp}_${name}`;

      migrations.push({
        id,
        name: name.replace(/_/g, " "),
        up: upPart,
        down: downPart,
        timestamp: parseInt(timestamp),
      });
    }

    return migrations;
  }

  async runMigrations(): Promise<void> {
    await this.initializeMigrationsTable();

    const executed = await this.getExecutedMigrations();
    const available = await this.getAvailableMigrations();

    const pending = available.filter(
      (migration) => !executed.includes(migration.id)
    );

    if (pending.length === 0) {
      console.log("No pending migrations");
      return;
    }

    console.log(`Running ${pending.length} pending migration(s)...`);

    for (const migration of pending) {
      try {
        console.log(`Running migration: ${migration.name}`);

        await database.transaction([
          { sql: migration.up },
          {
            sql: "INSERT INTO migrations (id, name) VALUES (?, ?)",
            params: [migration.id, migration.name],
          },
        ]);

        console.log(`✓ Migration completed: ${migration.name}`);
      } catch (error) {
        console.error(`✗ Migration failed: ${migration.name}`, error);
        throw error;
      }
    }

    console.log("All migrations completed successfully");
  }

  async rollbackLastMigration(): Promise<void> {
    const executed = await this.getExecutedMigrations();

    if (executed.length === 0) {
      console.log("No migrations to rollback");
      return;
    }

    const lastMigrationId = executed[executed.length - 1];
    const available = await this.getAvailableMigrations();
    const migration = available.find((m) => m.id === lastMigrationId);

    if (!migration) {
      throw new Error(`Migration file not found for: ${lastMigrationId}`);
    }

    try {
      console.log(`Rolling back migration: ${migration.name}`);

      await database.transaction([
        { sql: migration.down },
        {
          sql: "DELETE FROM migrations WHERE id = ?",
          params: [migration.id],
        },
      ]);

      console.log(`✓ Rollback completed: ${migration.name}`);
    } catch (error) {
      console.error(`✗ Rollback failed: ${migration.name}`, error);
      throw error;
    }
  }

  async getMigrationStatus(): Promise<{
    executed: string[];
    pending: string[];
  }> {
    const executed = await this.getExecutedMigrations();
    const available = await this.getAvailableMigrations();
    const pending = available
      .filter((migration) => !executed.includes(migration.id))
      .map((migration) => migration.id);

    return { executed, pending };
  }

  createMigrationFile(name: string): string {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${name
      .toLowerCase()
      .replace(/\s+/g, "_")}.sql`;
    const filePath = path.join(this.migrationsPath, fileName);

    const template = `-- UP
-- Add your migration SQL here


-- DOWN
-- Add your rollback SQL here

`;

    if (!fs.existsSync(this.migrationsPath)) {
      fs.mkdirSync(this.migrationsPath, { recursive: true });
    }

    fs.writeFileSync(filePath, template);
    console.log(`Migration file created: ${fileName}`);

    return filePath;
  }
}

export const migrationRunner = new MigrationRunner();
