import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { ProductSchema, CreateProductSchema } from "../modules/product/schema";
import { ResponseErrorSchema } from "../modules/common/schema";

import { prisma } from "../lib/prisma";
import { convertSlug } from "../lib/slug";

export const productsRoute = new OpenAPIHono();

// GET /products
productsRoute.openapi(
  createRoute({
    tags: ["products"],
    summary: "Get all products",
    method: "get",
    path: "/",
    responses: {
      200: {
        description: "Successful operation",
        content: { "application/json": { schema: z.array(ProductSchema) } },
      },
      400: {
        description: "Get all products failed",
        content: { "application/json": { schema: ResponseErrorSchema } },
      },
    },
  }),
  async (c) => {
    try {
      const products = await prisma.product.findMany({
        include: {
          category: true,
          images: true,
        },
      });
      return c.json(products, 200);
    } catch (error) {
      console.error(error);
      return c.json({ message: "Get all products failed", error }, 400);
    }
  }
);

// GET /products/:slug
productsRoute.openapi(
  createRoute({
    tags: ["products"],
    summary: "Get a product by slug",
    method: "get",
    path: "/:slug",
    request: { params: z.object({ slug: z.string() }) },
    responses: {
      200: {
        description: "Successful operation",
        content: { "application/json": { schema: ProductSchema } },
      },
      400: {
        description: "Get a product by slug failed",
        content: { "application/json": { schema: ResponseErrorSchema } },
      },
      404: { description: "Product not found" },
    },
  }),
  async (c) => {
    try {
      const { slug } = c.req.valid("param");

      const product = await prisma.product.findUnique({
        where: { slug },
        include: {
          category: true,
        },
      });

      if (!product) {
        return c.notFound();
      }
      return c.json(product, 200);
    } catch (error) {
      console.error(error);
      return c.json({ message: "Get a product by slug failed", error }, 400);
    }
  }
);

// POST /products
productsRoute.openapi(
  createRoute({
    tags: ["products"],
    summary: "Add new product",
    method: "post",
    path: "/",
    request: {
      body: {
        description: "New product to add",
        content: { "application/json": { schema: CreateProductSchema } },
      },
    },
    responses: {
      201: {
        description: "New product added",
        content: { "application/json": { schema: ProductSchema } },
      },
      400: {
        description: "Add new product failed",
        content: { "application/json": { schema: ResponseErrorSchema } },
      },
    },
  }),
  async (c) => {
    const body = c.req.valid("json");

    try {
      const product = await prisma.product.create({
        data: {
          name: body.name,
          slug: convertSlug(body.name),
          price: body.price,
          images: {
            connectOrCreate: body.images.map((image) => ({
              where: { url: image.url },
              create: { url: image.url, altText: image.altText },
            })),
          },
          category: { connect: { slug: body.categorySlug } },
        },
        include: {
          category: true,
          images: true,
        },
      });
      return c.json(product, 201);
    } catch (error) {
      console.error(error);
      return c.json({ message: "Add new product failed", error }, 400);
    }
  }
);
