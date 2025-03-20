import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { ResponseErrorSchema } from "../modules/common/schema";

import { prisma } from "../lib/prisma";
import { CategorySchema } from "../modules/category/schema";

export const categoriesRoute = new OpenAPIHono();

// GET /categories
categoriesRoute.openapi(
  createRoute({
    tags: ["categories"],
    summary: "Get all categories",
    method: "get",
    path: "/",
    responses: {
      200: {
        description: "Successful operation",
        content: { "application/json": { schema: z.array(CategorySchema) } },
      },
      400: {
        description: "Get all categories failed",
        content: { "application/json": { schema: ResponseErrorSchema } },
      },
    },
  }),
  async (c) => {
    try {
      const categories = await prisma.category.findMany({
        include: {
          products: true,
        },
      });
      return c.json(categories, 200);
    } catch (error) {
      console.error(error);
      return c.json({ message: "Get all categories failed", error }, 400);
    }
  }
);

// GET /categories/:slug
categoriesRoute.openapi(
  createRoute({
    tags: ["categories"],
    summary: "Get a category by slug",
    method: "get",
    path: "/:slug",
    request: { params: z.object({ slug: z.string() }) },
    responses: {
      404: { description: "Category not found" },
      400: {
        description: "Get a category by slug failed",
        content: { "application/json": { schema: ResponseErrorSchema } },
      },
      200: {
        description: "Successful operation",
        content: { "application/json": { schema: CategorySchema } },
      },
    },
  }),
  async (c) => {
    try {
      const { slug } = c.req.valid("param");

      const category = await prisma.category.findUnique({
        where: { slug },
      });

      if (!category) {
        return c.notFound();
      }
      return c.json(category, 200);
    } catch (error) {
      console.error(error);
      return c.json({ message: "Get a category by slug failed", error }, 400);
    }
  }
);
