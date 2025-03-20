import { z } from "zod";
import {
  ProductSchema as GeneratedProductSchema,
  CategorySchema as GeneratedCategorySchema,
  ProductImageSchema as GeneratedProductImageSchema,
} from "../../../prisma/generated/zod";
import {
  CreateProductImageSchema,
  SeedProductImageSchema,
} from "../image/schema";
import { PriceSchema, SeedPriceSchema } from "../common/schema";

export const ProductSchema = GeneratedProductSchema.extend({
  name: z.string().nonempty({ message: "Name is required" }),
  price: PriceSchema,
  category: GeneratedCategorySchema,
  images: z.array(GeneratedProductImageSchema),
});

export const CreateProductSchema = ProductSchema.omit({
  id: true,
  slug: true,
  categoryId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  price: z.number().refine((value) => value >= 0.01),
  images: z.array(CreateProductImageSchema),
  categorySlug: z.string(),
});

export const SeedProductSchema = GeneratedProductSchema.omit({
  id: true,
  categoryId: true,
  createdAt: true,
  updatedAt: true,
  featured: true,
}).extend({
  featured: z.boolean().optional(),
  price: SeedPriceSchema,
  images: z.array(SeedProductImageSchema),
  categorySlug: z.string(),
});
