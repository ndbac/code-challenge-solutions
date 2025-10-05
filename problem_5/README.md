# Express.js CRUD API with TypeScript and SQLite

## Features

- **Complete CRUD Operations**: Create, Read, Update, Delete for Users and Products
- **TypeScript**: Full type safety and modern JavaScript features
- **SQLite Database**: Lightweight, file-based database with raw SQL queries
- **Input Validation**: Joi-based request validation with comprehensive error messages
- **Database Migrations**: Professional migration system for schema management
- **Error Handling**: Centralized error handling with custom error types
- **Filtering & Pagination**: Advanced querying capabilities
- **CORS Support**: Cross-origin resource sharing enabled
- **Health Checks**: Built-in health monitoring endpoint
- **Graceful Shutdown**: Proper cleanup on application termination

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

## Installation & Setup

1. **Clone or navigate to the project directory**
   ```bash
   cd problem_5
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file as needed (optional, defaults work for development).

4. **Run database migrations**
   ```bash
   npm run migrate up
   ```

5. **Build the project**
   ```bash
   npm run build
   ```

## Running the Application

### Development Mode (with hot reload)
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

The server will start on `http://localhost:3000` by default.

## Health Check

Visit `http://localhost:3000/health` to verify the server is running.

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Response Format
All API responses follow this structure:
```json
{
  "success": boolean,
  "data": any,
  "message": string,
  "error": string
}
```

Paginated responses include additional pagination metadata:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

## Users API

### Create User
**POST** `/api/users`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30,
  "status": "active"
}
```

**Required Fields:** `name`, `email`
**Optional Fields:** `age`, `status` (default: "active")

### Get All Users
**GET** `/api/users`

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `name` (string): Filter by name (partial match)
- `email` (string): Filter by email (partial match)
- `status` (string): Filter by status ("active" or "inactive")
- `age_min` (number): Minimum age filter
- `age_max` (number): Maximum age filter

**Example:**
```
GET /api/users?page=1&limit=5&status=active&age_min=18
```

### Get User by ID
**GET** `/api/users/:id`

### Update User
**PUT** `/api/users/:id`

**Request Body:** (all fields optional)
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "age": 25,
  "status": "inactive"
}
```

### Delete User
**DELETE** `/api/users/:id`

## Products API

### Create Product
**POST** `/api/products`

**Request Body:**
```json
{
  "name": "Laptop",
  "description": "High-performance laptop",
  "price": 999.99,
  "category": "Electronics",
  "stock_quantity": 10,
  "is_active": true
}
```

**Required Fields:** `name`, `price`
**Optional Fields:** `description`, `category`, `stock_quantity` (default: 0), `is_active` (default: true)

### Get All Products
**GET** `/api/products`

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `name` (string): Filter by name (partial match)
- `category` (string): Filter by category (partial match)
- `price_min` (number): Minimum price filter
- `price_max` (number): Maximum price filter
- `is_active` (boolean): Filter by active status

**Example:**
```
GET /api/products?category=Electronics&price_min=100&price_max=1000
```

### Get Product by ID
**GET** `/api/products/:id`

### Update Product
**PUT** `/api/products/:id`

**Request Body:** (all fields optional)
```json
{
  "name": "Gaming Laptop",
  "description": "High-end gaming laptop",
  "price": 1299.99,
  "category": "Gaming",
  "stock_quantity": 5,
  "is_active": false
}
```

### Delete Product
**DELETE** `/api/products/:id`

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    age INTEGER,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Products Table
```sql
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category TEXT,
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Testing the API

### Using curl

**Create a user:**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","age":30}'
```

**Get all users:**
```bash
curl http://localhost:3000/api/users
```

**Get user by ID:**
```bash
curl http://localhost:3000/api/users/1
```

**Update user:**
```bash
curl -X PUT http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"John Smith","age":31}'
```

**Delete user:**
```bash
curl -X DELETE http://localhost:3000/api/users/1
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the project for production
- `npm start` - Start production server
- `npm run clean` - Remove build artifacts
- `npm run migrate up` - Run pending database migrations
- `npm run migrate down` - Rollback last migration
- `npm run migrate status` - Show migration status
- `npm run migrate reset` - Reset database (development only)
