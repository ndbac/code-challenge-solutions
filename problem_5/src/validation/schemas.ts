import Joi from "joi";

export const createUserSchema = Joi.object({
  name: Joi.string().min(1).max(100).required().messages({
    "string.empty": "Name is required",
    "string.min": "Name must be at least 1 character long",
    "string.max": "Name must be at most 100 characters long",
    "any.required": "Name is required",
  }),

  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),

  age: Joi.number().integer().min(0).max(150).optional().messages({
    "number.base": "Age must be a number",
    "number.integer": "Age must be an integer",
    "number.min": "Age must be at least 0",
    "number.max": "Age must be at most 150",
  }),

  status: Joi.string().valid("active", "inactive").default("active").messages({
    "any.only": 'Status must be either "active" or "inactive"',
  }),
});

export const updateUserSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional().messages({
    "string.empty": "Name cannot be empty",
    "string.min": "Name must be at least 1 character long",
    "string.max": "Name must be at most 100 characters long",
  }),

  email: Joi.string().email().optional().messages({
    "string.email": "Please provide a valid email address",
  }),

  age: Joi.number().integer().min(0).max(150).optional().messages({
    "number.base": "Age must be a number",
    "number.integer": "Age must be an integer",
    "number.min": "Age must be at least 0",
    "number.max": "Age must be at most 150",
  }),

  status: Joi.string().valid("active", "inactive").optional().messages({
    "any.only": 'Status must be either "active" or "inactive"',
  }),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided for update",
  });

export const createProductSchema = Joi.object({
  name: Joi.string().min(1).max(200).required().messages({
    "string.empty": "Product name is required",
    "string.min": "Product name must be at least 1 character long",
    "string.max": "Product name must be at most 200 characters long",
    "any.required": "Product name is required",
  }),

  description: Joi.string().max(1000).optional().allow("").messages({
    "string.max": "Description must be at most 1000 characters long",
  }),

  price: Joi.number().positive().precision(2).required().messages({
    "number.base": "Price must be a number",
    "number.positive": "Price must be a positive number",
    "any.required": "Price is required",
  }),

  category: Joi.string().max(100).optional().allow("").messages({
    "string.max": "Category must be at most 100 characters long",
  }),

  stock_quantity: Joi.number().integer().min(0).default(0).messages({
    "number.base": "Stock quantity must be a number",
    "number.integer": "Stock quantity must be an integer",
    "number.min": "Stock quantity must be at least 0",
  }),

  is_active: Joi.boolean().default(true).messages({
    "boolean.base": "is_active must be a boolean value",
  }),
});

export const updateProductSchema = Joi.object({
  name: Joi.string().min(1).max(200).optional().messages({
    "string.empty": "Product name cannot be empty",
    "string.min": "Product name must be at least 1 character long",
    "string.max": "Product name must be at most 200 characters long",
  }),

  description: Joi.string().max(1000).optional().allow("").messages({
    "string.max": "Description must be at most 1000 characters long",
  }),

  price: Joi.number().positive().precision(2).optional().messages({
    "number.base": "Price must be a number",
    "number.positive": "Price must be a positive number",
  }),

  category: Joi.string().max(100).optional().allow("").messages({
    "string.max": "Category must be at most 100 characters long",
  }),

  stock_quantity: Joi.number().integer().min(0).optional().messages({
    "number.base": "Stock quantity must be a number",
    "number.integer": "Stock quantity must be an integer",
    "number.min": "Stock quantity must be at least 0",
  }),

  is_active: Joi.boolean().optional().messages({
    "boolean.base": "is_active must be a boolean value",
  }),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided for update",
  });

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    "number.base": "Page must be a number",
    "number.integer": "Page must be an integer",
    "number.min": "Page must be at least 1",
  }),

  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    "number.base": "Limit must be a number",
    "number.integer": "Limit must be an integer",
    "number.min": "Limit must be at least 1",
    "number.max": "Limit must be at most 100",
  }),
});

export const userFiltersSchema = Joi.object({
  name: Joi.string().optional(),
  email: Joi.string().optional(),
  status: Joi.string().valid("active", "inactive").optional(),
  age_min: Joi.number().integer().min(0).optional(),
  age_max: Joi.number().integer().min(0).optional(),
}).concat(paginationSchema);

export const productFiltersSchema = Joi.object({
  name: Joi.string().optional(),
  category: Joi.string().optional(),
  price_min: Joi.number().positive().optional(),
  price_max: Joi.number().positive().optional(),
  is_active: Joi.boolean().optional(),
}).concat(paginationSchema);

export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "ID must be a number",
    "number.integer": "ID must be an integer",
    "number.positive": "ID must be a positive number",
    "any.required": "ID is required",
  }),
});
