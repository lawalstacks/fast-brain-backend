// src/common/validators/category.validator.ts
import { z } from "zod";

export const createCategorySchema = z.object({
    name: z.string()
        .min(2, "Category name must be at least 2 characters")
        .max(50, "Category name must not exceed 50 characters")
        .trim(),
    description: z.string()
        .max(500, "Description must not exceed 500 characters")
        .optional()
});

export const updateCategorySchema = z.object({
    name: z.string()
        .min(2, "Category name must be at least 2 characters")
        .max(50, "Category name must not exceed 50 characters")
        .trim()
        .optional(),
    description: z.string()
        .max(500, "Description must not exceed 500 characters")
        .optional()
});

