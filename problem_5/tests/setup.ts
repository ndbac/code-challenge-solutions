import { database } from "../src/database/connection";

// Mock the database connection for tests
jest.mock("../src/database/connection", () => ({
  database: {
    get: jest.fn(),
    query: jest.fn(),
    run: jest.fn(),
    close: jest.fn(),
  },
}));

// Global test setup
beforeEach(() => {
  jest.clearAllMocks();
});

afterAll(async () => {
  // Clean up any resources if needed
});

// Helper function to create mock database responses
export const createMockDbResponse = {
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

  runResult: (overrides: any = {}) => ({
    lastID: 1,
    changes: 1,
    ...overrides,
  }),

  countResult: (count: number = 1) => ({
    count,
  }),
};

// Helper to mock database methods
export const mockDatabase = database as jest.Mocked<typeof database>;
