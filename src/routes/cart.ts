import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { prisma } from "~/lib/prisma";
import { checkAuthorized, checkCart, Env } from "~/modules/auth/middleware";
import {
  PrivateCartItemSchema,
  PrivateCartSchema,
  RequestPatchCartItemsQuantitySchema,
  RequestPutCartItemsSchema,
} from "~/modules/cart/schema";
import { ResponseErrorSchema } from "~/modules/common/schema";

export const cartRoute = new OpenAPIHono<Env>();

const tags = ["cart"];

// GET /cart
cartRoute.openapi(
  createRoute({
    tags,
    summary: "Get authenticated user's cart",
    method: "get",
    path: "/",
    security: [{ Bearer: [] }],
    middleware: checkAuthorized,
    responses: {
      200: {
        description: "Successfully get authenticated user's cart",
        content: { "application/json": { schema: PrivateCartSchema } },
      },
      500: {
        description: "Failed to get authenticated user's cart",
        content: { "application/json": { schema: ResponseErrorSchema } },
      },
    },
  }),
  async (c) => {
    try {
      const user = c.get("user");

      const existingCart = await prisma.cart.findUnique({
        where: { userId: user.id },
        include: {
          items: {
            include: {
              product: { include: { images: true, category: true } },
            },
          },
        },
      });

      if (!existingCart) {
        const newCart = await prisma.cart.create({
          data: { userId: user.id },
          include: {
            items: {
              include: {
                product: { include: { images: true, category: true } },
              },
            },
          },
        });
        return c.json(newCart, 200);
      }

      return c.json(existingCart, 200);
    } catch (error) {
      console.error(error);
      return c.json(
        { message: "Failed to get authenticated user's cart", error },
        500
      );
    }
  }
);

// PUT /cart/items
cartRoute.openapi(
  createRoute({
    tags,
    summary: "Add product to cart",
    method: "put",
    path: "/items",
    security: [{ Bearer: [] }],
    middleware: [checkAuthorized, checkCart],
    request: {
      body: {
        description: "Product and quantity",
        content: { "application/json": { schema: RequestPutCartItemsSchema } },
      },
    },
    responses: {
      200: {
        description: "Successfully add product to cart",
        content: { "application/json": { schema: PrivateCartItemSchema } },
      },
      400: {
        description: "Failed to add product to cart because cart not found",
        content: { "application/json": { schema: ResponseErrorSchema } },
      },
      500: {
        description: "Failed to add product to cart",
        content: { "application/json": { schema: ResponseErrorSchema } },
      },
    },
  }),
  async (c) => {
    try {
      const cart = c.get("cart");
      const body = c.req.valid("json");

      const product = await prisma.product.findUnique({
        where: { id: body.productId },
      });
      if (!product) return c.json({ message: "Product not found" }, 400);

      const existingCartItem = cart.items.find((item) => {
        return item.productId === body.productId;
      });

      // IF NO CART ITEM = NEW PRODUCT TO ADD
      if (!existingCartItem) {
        if (body.quantity <= 0) {
          return c.json({ message: "Quantity cannot be less than 0" }, 400);
        }

        const isQuantityLessEqualThanStock =
          body.quantity <= product.stockQuantity;

        if (!isQuantityLessEqualThanStock) {
          return c.json({ message: "Quantity is greater than stock" }, 400);
        }

        const newCartItem = await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: body.productId,
            quantity: body.quantity,
            totalPrice: body.quantity * Number(product.price),
          },
          include: { product: { include: { images: true } } },
        });

        const newTotalPrice =
          Number(cart.totalPrice) + Number(newCartItem.totalPrice);
        const newTotalQuantity = cart.totalQuantity + newCartItem.quantity;

        await prisma.cart.update({
          where: { id: cart.id },
          data: { totalPrice: newTotalPrice, totalQuantity: newTotalQuantity },
        });

        return c.json(newCartItem, 200);
      }

      // IF EXIST CART ITEM = EXISTING PRODUCT TO ADD
      const totalQuantity = existingCartItem.quantity + body.quantity;
      if (totalQuantity <= 0) {
        return c.json(
          {
            message: `Total quantity cannot be less than 0. ${totalQuantity} total requested.`,
          },
          400
        );
      }

      const isTotalQuantityLessEqualThanStock =
        totalQuantity <= product.stockQuantity;
      if (!isTotalQuantityLessEqualThanStock) {
        return c.json(
          {
            message: `Total quantity is greater than stock. ${totalQuantity} total requested.`,
          },
          400
        );
      }

      const updatedCartItem = await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: {
          quantity: totalQuantity,
          totalPrice: totalQuantity * Number(product.price),
        },
        include: { product: { include: { images: true } } },
      });

      const newTotalPrice =
        Number(cart.totalPrice) + Number(body.quantity) * Number(product.price);
      const newTotalQuantity = cart.totalQuantity + body.quantity;
      await prisma.cart.update({
        where: { id: cart.id },
        data: { totalPrice: newTotalPrice, totalQuantity: newTotalQuantity },
      });

      return c.json(updatedCartItem, 200);
    } catch (error) {
      console.error(error);
      return c.json({ message: "Failed to add product to cart", error }, 500);
    }
  }
);

// DELETE /cart/items/:id
cartRoute.openapi(
  createRoute({
    tags,
    summary: "Remove product from cart",
    method: "delete",
    path: "/items/:id",
    security: [{ Bearer: [] }],
    middleware: [checkAuthorized, checkCart],
    request: { params: z.object({ id: z.string() }) },
    responses: {
      200: {
        description: "Successfully remove product from cart",
        content: { "application/json": { schema: PrivateCartItemSchema } },
      },
      404: {
        description:
          "Failed to remove product from cart because cart item not found",
      },
      500: {
        description: "Failed to remove product from cart",
        content: { "application/json": { schema: ResponseErrorSchema } },
      },
    },
  }),
  async (c) => {
    try {
      const user = c.get("user");
      const { id } = c.req.valid("param");

      const cartItem = await prisma.cartItem.delete({
        where: { id, cart: { userId: user.id } },
      });

      if (!cartItem) {
        return c.json({ message: "Cart item not found" }, 404);
      }

      const cart = c.get("cart");
      const newCartTotalQuantity = cart.totalQuantity - cartItem.quantity;
      const newTotalPrice =
        Number(cart.totalPrice) - Number(cartItem.totalPrice);

      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          totalQuantity: newCartTotalQuantity,
          totalPrice: newTotalPrice,
        },
      });

      return c.json(cartItem, 200);
    } catch (error) {
      console.error(error);
      return c.json(
        { message: "Failed to remove product from cart", error },
        500
      );
    }
  }
);

// PATCH /cart/items/:id
cartRoute.openapi(
  createRoute({
    tags,
    summary: "Update product quantity in cart",
    method: "patch",
    path: "/items/:id",
    security: [{ Bearer: [] }],
    middleware: [checkAuthorized, checkCart],
    request: {
      params: z.object({ id: z.string() }),
      body: {
        description: "Product quantity to update",
        content: {
          "application/json": { schema: RequestPatchCartItemsQuantitySchema },
        },
      },
    },
    responses: {
      200: {
        description: "Successfully update product quantity in cart",
        content: { "application/json": { schema: PrivateCartItemSchema } },
      },
      404: {
        description:
          "Failed to update product quantity in cart because cart item not found",
      },
      500: {
        description: "Failed to update product quantity in cart",
        content: { "application/json": { schema: ResponseErrorSchema } },
      },
    },
  }),
  async (c) => {
    try {
      const user = c.get("user");
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");

      const cartItem = await prisma.cartItem.findUnique({
        where: { id, cart: { userId: user.id } },
      });

      if (!cartItem) {
        return c.json({ message: "Cart item not found" }, 404);
      }

      const product = await prisma.product.findUnique({
        where: { id: cartItem.productId },
      });

      if (!product) {
        return c.json({ message: "Product not found" }, 404);
      }

      const { quantity: newQuantity } = body;
      const newSubtotalPrice = Number(product.price) * newQuantity;

      const cart = c.get("cart");
      const newCartTotalQuantity =
        cart.totalQuantity - cartItem.quantity + newQuantity;
      const newTotalPrice =
        Number(cart.totalPrice) -
        Number(cartItem.totalPrice) +
        newSubtotalPrice;

      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          totalQuantity: newCartTotalQuantity,
          totalPrice: newTotalPrice,
        },
      });

      const updatedCartItem = await prisma.cartItem.update({
        where: { id },
        data: { quantity: newQuantity, totalPrice: newSubtotalPrice },
        include: { product: true },
      });

      return c.json(updatedCartItem, 200);
    } catch (error) {
      console.error(error);
      return c.json(
        { message: "Failed to update product quantity in cart", error },
        500
      );
    }
  }
);
