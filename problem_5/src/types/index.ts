export interface User {
  id: number;
  name: string;
  email: string;
  age?: number;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  age?: number;
  status?: "active" | "inactive";
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  age?: number;
  status?: "active" | "inactive";
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  category?: string;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  category?: string;
  stock_quantity?: number;
  is_active?: boolean;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  stock_quantity?: number;
  is_active?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserFilters {
  name?: string;
  email?: string;
  status?: "active" | "inactive";
  age_min?: number;
  age_max?: number;
}

export interface ProductFilters {
  name?: string;
  category?: string;
  price_min?: number;
  price_max?: number;
  is_active?: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface DatabaseResult {
  lastID?: number;
  changes: number;
}
