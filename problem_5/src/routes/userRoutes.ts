import { Router } from "express";
import { UserController } from "../controllers/userController";
import {
  validateCreateUser,
  validateUpdateUser,
  validateIdParam,
} from "../middleware/validation";

const router = Router();

router.get("/", UserController.getUsers);

router.post("/", validateCreateUser, UserController.createUser);

router.get("/:id", validateIdParam, UserController.getUserById);

router.put(
  "/:id",
  validateIdParam,
  validateUpdateUser,
  UserController.updateUser
);

router.delete("/:id", validateIdParam, UserController.deleteUser);

export default router;
