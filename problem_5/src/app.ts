import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { database } from "./database/connection";
import { databaseSchema } from "./database/schema";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import userRoutes from "./routes/userRoutes";
import productRoutes from "./routes/productRoutes";

dotenv.config();

class App {
  public app: express.Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || "3000");

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    this.app.use(
      cors({
        origin: process.env.CORS_ORIGIN || "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
      })
    );

    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });

    this.app.get("/health", (req, res) => {
      res.json({
        success: true,
        message: "Server is running",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });
  }

  private initializeRoutes(): void {
    this.app.use("/api/users", userRoutes);
    this.app.use("/api/products", productRoutes);

    this.app.get("/", (req, res) => {
      res.json({
        success: true,
        message: "Express CRUD API with TypeScript and SQLite",
        version: "1.0.0",
        endpoints: {
          users: "/api/users",
          products: "/api/products",
          health: "/health",
        },
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(notFoundHandler);

    this.app.use(errorHandler);
  }

  async initializeDatabase(): Promise<void> {
    try {
      await database.connect();
      await databaseSchema.initializeTables();
      console.log("Database initialized successfully");
    } catch (error) {
      console.error("Failed to initialize database:", error);
      throw error;
    }
  }

  async start(): Promise<void> {
    try {
      await this.initializeDatabase();

      this.app.listen(this.port, () => {
        console.log(`🚀 Server running on port ${this.port}`);
        console.log(`📊 Health check: http://localhost:${this.port}/health`);
        console.log(`👥 Users API: http://localhost:${this.port}/api/users`);
        console.log(
          `📦 Products API: http://localhost:${this.port}/api/products`
        );
      });
    } catch (error) {
      console.error("Failed to start server:", error);
      process.exit(1);
    }
  }

  async shutdown(): Promise<void> {
    try {
      await database.close();
      console.log("Server shutdown completed");
    } catch (error) {
      console.error("Error during shutdown:", error);
    }
  }
}

export default App;
