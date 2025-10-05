#!/usr/bin/env ts-node

import { database } from "../database/connection";
import { migrationRunner } from "../database/migrationRunner";

async function main() {
  const command = process.argv[2];

  try {
    await database.connect();

    switch (command) {
      case "up":
        await migrationRunner.runMigrations();
        break;

      case "down":
        await migrationRunner.rollbackLastMigration();
        break;

      case "status":
        const status = await migrationRunner.getMigrationStatus();
        console.log("Migration Status:");
        console.log("Executed:", status.executed);
        console.log("Pending:", status.pending);
        break;

      case "create":
        const name = process.argv[3];
        if (!name) {
          console.error("Please provide a migration name");
          process.exit(1);
        }
        migrationRunner.createMigrationFile(name);
        break;

      case "reset":
        console.log("Resetting database...");
        await database.run("DROP TABLE IF EXISTS migrations");
        await database.run("DROP TABLE IF EXISTS users");
        await database.run("DROP TABLE IF EXISTS products");
        console.log("Database reset completed");
        break;

      default:
        console.log("Usage:");
        console.log("  npm run migrate up      - Run pending migrations");
        console.log("  npm run migrate down    - Rollback last migration");
        console.log("  npm run migrate status  - Show migration status");
        console.log("  npm run migrate create <name> - Create new migration");
        console.log("  npm run migrate reset   - Reset database");
        break;
    }
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  } finally {
    await database.close();
  }
}

main();
