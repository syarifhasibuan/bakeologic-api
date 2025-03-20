import { z } from "zod";
import {
  CategorySchema as GeneratedCategorySchema,
  ProductSchema as GeneratedProductSchema,
} from "../../../prisma/generated/zod";

export const SeedCategorySchema = z.object({
  name: z.string(),
  slug: z.string(),
});

export const CategorySchema = GeneratedCategorySchema.extend({
  products: z.array(GeneratedProductSchema),
});
