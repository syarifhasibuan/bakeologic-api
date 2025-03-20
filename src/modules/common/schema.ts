import { Prisma } from "@prisma/client";
import { z } from "zod";

export const ResponseErrorSchema = z.object({
  message: z.string(),
  error: z.any(),
});

export const PriceSchema = z
  .instanceof(Prisma.Decimal)
  .refine((value) => value.gte("0.01"));

export const SeedPriceSchema = z.number().refine((value) => value >= 0.01);
