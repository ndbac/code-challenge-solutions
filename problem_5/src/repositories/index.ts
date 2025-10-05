export { BaseRepository } from "./BaseRepository";
export { UserRepository } from "./UserRepository";
export { ProductRepository } from "./ProductRepository";

import { UserRepository } from "./UserRepository";
import { ProductRepository } from "./ProductRepository";

export const userRepository = new UserRepository();
export const productRepository = new ProductRepository();
