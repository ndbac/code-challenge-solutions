import { BaseRepository } from "../../src/repositories/BaseRepository";
import { ApiError } from "../../src/middleware/errorHandler";
import { mockDatabase, createMockDbResponse } from "../setup";

// Create a concrete implementation for testing
class TestRepository extends BaseRepository<any> {
  constructor() {
    super("test_table");
  }
}

describe("BaseRepository", () => {
  let repository: TestRepository;

  beforeEach(() => {
    repository = new TestRepository();
  });

  describe("findById", () => {
    it("should return a record when found", async () => {
      const mockRecord = createMockDbResponse.user();
      mockDatabase.get.mockResolvedValue(mockRecord);

      const result = await repository.findById(1);

      expect(result).toEqual(mockRecord);
      expect(mockDatabase.get).toHaveBeenCalledWith(
        "SELECT * FROM test_table WHERE id = ?",
        [1]
      );
    });

    it("should return null when record not found", async () => {
      mockDatabase.get.mockResolvedValue(undefined);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });

    it("should throw ApiError on database error", async () => {
      mockDatabase.get.mockRejectedValue(new Error("Database error"));

      await expect(repository.findById(1)).rejects.toThrow(ApiError);
    });
  });

  describe("findAll", () => {
    it("should return all records with default parameters", async () => {
      const mockRecords = [
        createMockDbResponse.user(),
        createMockDbResponse.user({ id: 2 }),
      ];
      mockDatabase.query.mockResolvedValue(mockRecords);

      const result = await repository.findAll();

      expect(result).toEqual(mockRecords);
      expect(mockDatabase.query).toHaveBeenCalledWith(
        "SELECT * FROM test_table ORDER BY created_at DESC",
        []
      );
    });

    it("should apply where clause and parameters", async () => {
      const mockRecords = [createMockDbResponse.user()];
      mockDatabase.query.mockResolvedValue(mockRecords);

      const result = await repository.findAll("status = ?", ["active"]);

      expect(result).toEqual(mockRecords);
      expect(mockDatabase.query).toHaveBeenCalledWith(
        "SELECT * FROM test_table WHERE status = ? ORDER BY created_at DESC",
        ["active"]
      );
    });

    it("should apply limit and offset", async () => {
      const mockRecords = [createMockDbResponse.user()];
      mockDatabase.query.mockResolvedValue(mockRecords);

      const result = await repository.findAll("", [], "id ASC", 10, 20);

      expect(result).toEqual(mockRecords);
      expect(mockDatabase.query).toHaveBeenCalledWith(
        "SELECT * FROM test_table ORDER BY id ASC LIMIT ? OFFSET ?",
        [10, 20]
      );
    });
  });

  describe("count", () => {
    it("should return count without where clause", async () => {
      mockDatabase.get.mockResolvedValue(createMockDbResponse.countResult(5));

      const result = await repository.count();

      expect(result).toBe(5);
      expect(mockDatabase.get).toHaveBeenCalledWith(
        "SELECT COUNT(*) as count FROM test_table",
        []
      );
    });

    it("should return count with where clause", async () => {
      mockDatabase.get.mockResolvedValue(createMockDbResponse.countResult(3));

      const result = await repository.count("status = ?", ["active"]);

      expect(result).toBe(3);
      expect(mockDatabase.get).toHaveBeenCalledWith(
        "SELECT COUNT(*) as count FROM test_table WHERE status = ?",
        ["active"]
      );
    });

    it("should return 0 when no count result", async () => {
      mockDatabase.get.mockResolvedValue(undefined);

      const result = await repository.count();

      expect(result).toBe(0);
    });
  });

  describe("create", () => {
    it("should create a new record successfully", async () => {
      const mockRunResult = createMockDbResponse.runResult();
      const mockCreatedRecord = createMockDbResponse.user();

      mockDatabase.run.mockResolvedValue(mockRunResult);
      mockDatabase.get.mockResolvedValue(mockCreatedRecord);

      const data = { name: "John Doe", email: "john@example.com" };
      const fields = ["name", "email"];

      const result = await repository.create(data, fields);

      expect(result).toEqual(mockCreatedRecord);
      expect(mockDatabase.run).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO test_table (name, email)"),
        ["John Doe", "john@example.com"]
      );
    });

    it("should throw error when no lastID returned", async () => {
      mockDatabase.run.mockResolvedValue({ changes: 1 });

      const data = { name: "John Doe" };
      const fields = ["name"];

      await expect(repository.create(data, fields)).rejects.toThrow(ApiError);
    });
  });

  describe("update", () => {
    it("should update an existing record successfully", async () => {
      const mockExistingRecord = createMockDbResponse.user();
      const mockUpdatedRecord = createMockDbResponse.user({ name: "Jane Doe" });
      const mockRunResult = createMockDbResponse.runResult();

      mockDatabase.get
        .mockResolvedValueOnce(mockExistingRecord)
        .mockResolvedValueOnce(mockUpdatedRecord);
      mockDatabase.run.mockResolvedValue(mockRunResult);

      const data = { name: "Jane Doe" };
      const fields = ["name"];

      const result = await repository.update(1, data, fields);

      expect(result).toEqual(mockUpdatedRecord);
      expect(mockDatabase.run).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE test_table"),
        ["Jane Doe", 1]
      );
    });

    it("should return null when record does not exist", async () => {
      mockDatabase.get.mockResolvedValue(undefined);

      const result = await repository.update(999, { name: "Jane" }, ["name"]);

      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    it("should delete an existing record successfully", async () => {
      const mockExistingRecord = createMockDbResponse.user();
      const mockRunResult = createMockDbResponse.runResult();

      mockDatabase.get.mockResolvedValue(mockExistingRecord);
      mockDatabase.run.mockResolvedValue(mockRunResult);

      const result = await repository.delete(1);

      expect(result).toBe(true);
      expect(mockDatabase.run).toHaveBeenCalledWith(
        "DELETE FROM test_table WHERE id = ?",
        [1]
      );
    });

    it("should return false when record does not exist", async () => {
      mockDatabase.get.mockResolvedValue(undefined);

      const result = await repository.delete(999);

      expect(result).toBe(false);
    });
  });

  describe("exists", () => {
    it("should return true when record exists", async () => {
      mockDatabase.get.mockResolvedValue(createMockDbResponse.countResult(1));

      const result = await repository.exists(1);

      expect(result).toBe(true);
    });

    it("should return false when record does not exist", async () => {
      mockDatabase.get.mockResolvedValue(createMockDbResponse.countResult(0));

      const result = await repository.exists(999);

      expect(result).toBe(false);
    });
  });

  describe("findWithPagination", () => {
    it("should return paginated results", async () => {
      const mockRecords = [
        createMockDbResponse.user(),
        createMockDbResponse.user({ id: 2 }),
      ];
      mockDatabase.get.mockResolvedValue(createMockDbResponse.countResult(25));
      mockDatabase.query.mockResolvedValue(mockRecords);

      const result = await repository.findWithPagination(2, 10);

      expect(result).toEqual({
        data: mockRecords,
        total: 25,
        page: 2,
        limit: 10,
        totalPages: 3,
      });
    });
  });
});
