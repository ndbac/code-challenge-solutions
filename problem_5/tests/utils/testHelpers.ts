import { Request, Response } from "express";

export const createMockRequest = (
  overrides: Partial<Request> = {}
): Partial<Request> => {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    method: "GET",
    url: "/",
    ...overrides,
  };
};

export const createMockResponse = (): {
  response: Partial<Response>;
  mockJson: jest.Mock;
  mockStatus: jest.Mock;
  mockSend: jest.Mock;
} => {
  const mockJson = jest.fn();
  const mockSend = jest.fn();
  const mockStatus = jest.fn().mockReturnValue({
    json: mockJson,
    send: mockSend,
  });

  const response: Partial<Response> = {
    json: mockJson,
    send: mockSend,
    status: mockStatus,
  };

  return {
    response,
    mockJson,
    mockStatus,
    mockSend,
  };
};

export const createMockDatabaseResults = {
  user: (overrides: any = {}) => ({
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    age: 30,
    status: "active",
    created_at: "2023-01-01T00:00:00.000Z",
    updated_at: "2023-01-01T00:00:00.000Z",
    ...overrides,
  }),

  product: (overrides: any = {}) => ({
    id: 1,
    name: "Test Product",
    description: "Test Description",
    price: 99.99,
    category: "Electronics",
    stock_quantity: 10,
    is_active: true,
    created_at: "2023-01-01T00:00:00.000Z",
    updated_at: "2023-01-01T00:00:00.000Z",
    ...overrides,
  }),

  paginatedResult: <T>(data: T[], overrides: any = {}) => ({
    data,
    total: data.length,
    page: 1,
    limit: 10,
    totalPages: Math.ceil(data.length / 10),
    ...overrides,
  }),

  runResult: (overrides: any = {}) => ({
    lastID: 1,
    changes: 1,
    ...overrides,
  }),

  countResult: (count: number = 1) => ({
    count,
  }),
};

/**
 * Helper function to create test data for users
 */
export const createTestUserData = {
  valid: () => ({
    name: "John Doe",
    email: "john@example.com",
    age: 30,
    status: "active" as const,
  }),

  minimal: () => ({
    name: "Jane Doe",
    email: "jane@example.com",
  }),

  invalid: {
    missingName: () => ({
      email: "john@example.com",
    }),

    missingEmail: () => ({
      name: "John Doe",
    }),

    invalidEmail: () => ({
      name: "John Doe",
      email: "invalid-email",
    }),

    invalidStatus: () => ({
      name: "John Doe",
      email: "john@example.com",
      status: "invalid-status",
    }),

    negativeAge: () => ({
      name: "John Doe",
      email: "john@example.com",
      age: -5,
    }),
  },
};

/**
 * Helper function to create test data for products
 */
export const createTestProductData = {
  valid: () => ({
    name: "Test Product",
    description: "Test Description",
    price: 99.99,
    category: "Electronics",
    stock_quantity: 10,
    is_active: true,
  }),

  minimal: () => ({
    name: "Minimal Product",
    price: 49.99,
  }),

  invalid: {
    missingName: () => ({
      price: 99.99,
    }),

    missingPrice: () => ({
      name: "Test Product",
    }),

    negativePrice: () => ({
      name: "Test Product",
      price: -10,
    }),

    negativeStock: () => ({
      name: "Test Product",
      price: 99.99,
      stock_quantity: -5,
    }),

    invalidActive: () => ({
      name: "Test Product",
      price: 99.99,
      is_active: "invalid",
    }),
  },
};

export const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const generateRandomData = {
  email: () => `test${Math.random().toString(36).substring(7)}@example.com`,
  name: () => `Test User ${Math.random().toString(36).substring(7)}`,
  productName: () => `Test Product ${Math.random().toString(36).substring(7)}`,
  price: () => Math.round(Math.random() * 1000 * 100) / 100,
  age: () => Math.floor(Math.random() * 80) + 18,
  stock: () => Math.floor(Math.random() * 100),
};

export const assertApiResponse = {
  success: (response: any, expectedData?: any) => {
    expect(response).toHaveProperty("success", true);
    if (expectedData) {
      expect(response).toHaveProperty("data", expectedData);
    }
  },

  error: (response: any, expectedError?: string) => {
    expect(response).toHaveProperty("success", false);
    expect(response).toHaveProperty("error");
    if (expectedError) {
      expect(response.error).toContain(expectedError);
    }
  },

  paginated: (response: any, expectedData?: any[]) => {
    expect(response).toHaveProperty("success", true);
    expect(response).toHaveProperty("data");
    expect(response).toHaveProperty("pagination");
    expect(response.pagination).toHaveProperty("page");
    expect(response.pagination).toHaveProperty("limit");
    expect(response.pagination).toHaveProperty("total");
    expect(response.pagination).toHaveProperty("totalPages");

    if (expectedData) {
      expect(response.data).toEqual(expectedData);
    }
  },
};

export const setupTestDatabase = () => {
  return {
    setup: async () => {
      // Setup test database
    },
    teardown: async () => {
      // Clean up test database
    },
    seed: async (data: any) => {
      // Seed test database with data
    },
  };
};
