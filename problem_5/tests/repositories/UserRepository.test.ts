import { UserRepository } from "../../src/repositories/UserRepository";
import { ApiError } from "../../src/middleware/errorHandler";
import { mockDatabase, createMockDbResponse } from "../setup";

describe("UserRepository", () => {
  let userRepository: UserRepository;

  beforeEach(() => {
    userRepository = new UserRepository();
  });

  describe("createUser", () => {
    it("should create a user successfully", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        age: 30,
        status: "active" as const,
      };

      const mockCreatedUser = createMockDbResponse.user(userData);

      mockDatabase.get
        .mockResolvedValueOnce(null) // No existing user (findByEmail)
        .mockResolvedValueOnce(mockCreatedUser); // Created user (findById)
      mockDatabase.run.mockResolvedValue(createMockDbResponse.runResult());

      const result = await userRepository.createUser(userData);

      expect(result).toEqual(mockCreatedUser);
      expect(mockDatabase.run).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO users"),
        expect.arrayContaining(["John Doe", "john@example.com", 30, "active"])
      );
    });

    it("should throw error when email already exists", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
      };

      const existingUser = createMockDbResponse.user({
        email: "john@example.com",
      });
      mockDatabase.get.mockResolvedValue(existingUser);

      await expect(userRepository.createUser(userData)).rejects.toThrow(
        new ApiError("Email already exists", 400)
      );
    });

    it("should set default status to active when not provided", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
      };

      const mockCreatedUser = createMockDbResponse.user({
        ...userData,
        status: "active",
      });

      mockDatabase.get
        .mockResolvedValueOnce(null) // No existing user (findByEmail)
        .mockResolvedValueOnce(mockCreatedUser); // Created user (findById)
      mockDatabase.run.mockResolvedValue(createMockDbResponse.runResult());

      const result = await userRepository.createUser(userData);

      expect(result.status).toBe("active");
    });
  });

  describe("updateUser", () => {
    it("should update user successfully", async () => {
      const updateData = { name: "Jane Doe", age: 25 };
      const mockUpdatedUser = createMockDbResponse.user(updateData);

      mockDatabase.get
        .mockResolvedValueOnce(createMockDbResponse.user()) // existing user check
        .mockResolvedValueOnce(mockUpdatedUser); // updated user
      mockDatabase.run.mockResolvedValue(createMockDbResponse.runResult());

      const result = await userRepository.updateUser(1, updateData);

      expect(result).toEqual(mockUpdatedUser);
    });

    it("should throw error when updating to existing email", async () => {
      const updateData = { email: "existing@example.com" };
      const existingUser = createMockDbResponse.user({
        id: 2,
        email: "existing@example.com",
      });

      mockDatabase.get.mockResolvedValue(existingUser);

      await expect(userRepository.updateUser(1, updateData)).rejects.toThrow(
        new ApiError("Email already exists", 400)
      );
    });

    it("should allow updating to same email for same user", async () => {
      const updateData = { email: "john@example.com", name: "John Updated" };
      const existingUser = createMockDbResponse.user({
        id: 1,
        email: "john@example.com",
      });
      const updatedUser = createMockDbResponse.user({
        ...existingUser,
        name: "John Updated",
      });

      mockDatabase.get
        .mockResolvedValueOnce(existingUser) // email check
        .mockResolvedValueOnce(existingUser) // existing user check
        .mockResolvedValueOnce(updatedUser); // updated user
      mockDatabase.run.mockResolvedValue(createMockDbResponse.runResult());

      const result = await userRepository.updateUser(1, updateData);

      expect(result).toEqual(updatedUser);
    });

    it("should throw error when no valid fields to update", async () => {
      await expect(userRepository.updateUser(1, {})).rejects.toThrow(
        new ApiError("No valid fields to update", 400)
      );
    });
  });

  describe("findByEmail", () => {
    it("should find user by email", async () => {
      const mockUser = createMockDbResponse.user({ email: "john@example.com" });
      mockDatabase.get.mockResolvedValue(mockUser);

      const result = await userRepository.findByEmail("john@example.com");

      expect(result).toEqual(mockUser);
      expect(mockDatabase.get).toHaveBeenCalledWith(
        "SELECT * FROM users WHERE email = ?",
        ["john@example.com"]
      );
    });

    it("should return null when user not found", async () => {
      mockDatabase.get.mockResolvedValue(null);

      const result = await userRepository.findByEmail(
        "nonexistent@example.com"
      );

      expect(result).toBeNull();
    });
  });

  describe("findUsersWithFilters", () => {
    it("should find users with filters and pagination", async () => {
      const filters = { status: "active" as const, age_min: 18 };
      const mockUsers = [
        createMockDbResponse.user(),
        createMockDbResponse.user({ id: 2 }),
      ];

      mockDatabase.get.mockResolvedValue(createMockDbResponse.countResult(2));
      mockDatabase.query.mockResolvedValue(mockUsers);

      const result = await userRepository.findUsersWithFilters(filters, 1, 10);

      expect(result).toEqual({
        data: mockUsers,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });
  });

  describe("findByStatus", () => {
    it("should find users by status", async () => {
      const mockUsers = [createMockDbResponse.user({ status: "active" })];
      mockDatabase.query.mockResolvedValue(mockUsers);

      const result = await userRepository.findByStatus("active");

      expect(result).toEqual(mockUsers);
      expect(mockDatabase.query).toHaveBeenCalledWith(
        "SELECT * FROM users WHERE status = ? ORDER BY created_at DESC",
        ["active"]
      );
    });
  });

  describe("findByAgeRange", () => {
    it("should find users by age range with both min and max", async () => {
      const mockUsers = [createMockDbResponse.user({ age: 25 })];
      mockDatabase.query.mockResolvedValue(mockUsers);

      const result = await userRepository.findByAgeRange(18, 65);

      expect(result).toEqual(mockUsers);
      expect(mockDatabase.query).toHaveBeenCalledWith(
        "SELECT * FROM users WHERE 1=1 AND age >= ? AND age <= ? ORDER BY age ASC",
        [18, 65]
      );
    });

    it("should find users by minimum age only", async () => {
      const mockUsers = [createMockDbResponse.user({ age: 25 })];
      mockDatabase.query.mockResolvedValue(mockUsers);

      const result = await userRepository.findByAgeRange(18);

      expect(result).toEqual(mockUsers);
      expect(mockDatabase.query).toHaveBeenCalledWith(
        "SELECT * FROM users WHERE 1=1 AND age >= ? ORDER BY age ASC",
        [18]
      );
    });
  });

  describe("searchByName", () => {
    it("should search users by name", async () => {
      const mockUsers = [createMockDbResponse.user({ name: "John Doe" })];
      mockDatabase.query.mockResolvedValue(mockUsers);

      const result = await userRepository.searchByName("John");

      expect(result).toEqual(mockUsers);
      expect(mockDatabase.query).toHaveBeenCalledWith(
        "SELECT * FROM users WHERE name LIKE ? ORDER BY name ASC",
        ["%John%"]
      );
    });
  });

  describe("getUserStats", () => {
    it("should return user statistics", async () => {
      mockDatabase.get
        .mockResolvedValueOnce(createMockDbResponse.countResult(100)) // total
        .mockResolvedValueOnce(createMockDbResponse.countResult(80)) // active
        .mockResolvedValueOnce(createMockDbResponse.countResult(20)) // inactive
        .mockResolvedValueOnce({ avg_age: 32.5 }); // average age

      const result = await userRepository.getUserStats();

      expect(result).toEqual({
        total: 100,
        active: 80,
        inactive: 20,
        averageAge: 33, // rounded
      });
    });
  });

  describe("softDelete", () => {
    it("should soft delete user by setting status to inactive", async () => {
      mockDatabase.run.mockResolvedValue(createMockDbResponse.runResult());

      const result = await userRepository.softDelete(1);

      expect(result).toBe(true);
      expect(mockDatabase.run).toHaveBeenCalledWith(
        "UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        ["inactive", 1]
      );
    });

    it("should return false when no changes made", async () => {
      mockDatabase.run.mockResolvedValue({ changes: 0 });

      const result = await userRepository.softDelete(999);

      expect(result).toBe(false);
    });
  });

  describe("reactivate", () => {
    it("should reactivate user by setting status to active", async () => {
      mockDatabase.run.mockResolvedValue(createMockDbResponse.runResult());

      const result = await userRepository.reactivate(1);

      expect(result).toBe(true);
      expect(mockDatabase.run).toHaveBeenCalledWith(
        "UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        ["active", 1]
      );
    });
  });
});
