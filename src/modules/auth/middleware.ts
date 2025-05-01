import { createMiddleware } from "hono/factory";
import { prisma } from "~/lib/prisma";
import { TokenPayload, verifyToken } from "~/lib/token";
import { PrivateUser } from "~/modules/user/schema";
import { PrivateCart } from "~/modules/cart/schema";

export type Env = {
  Variables: {
    user: PrivateUser;
    cart: PrivateCart;
  };
};

/**
 * Check for header and token
 *
 * Authorization: Bearer <token>
 */
export const checkAuthorized = createMiddleware<Env>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader) {
    return c.json({ message: "Authorization header not found" }, 401);
  }

  const [type, token] = authHeader.split(" ");
  if (type !== "Bearer") {
    return c.json({ message: "Authorization type is not supported" }, 401);
  }
  if (!token || token === "undefined") {
    return c.json({ message: "Token not found" }, 401);
  }

  const payload = (await verifyToken(token)) as TokenPayload;
  if (!payload) {
    return c.json({ message: "Invalid token" }, 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
  });
  if (!user) {
    return c.json({ message: "User not found" }, 401);
  }

  c.set("user", user);

  await next();
});

// Check for cart
export const checkCart = createMiddleware<Env>(async (c, next) => {
  const user = c.get("user");

  const existingCart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: {
      items: { include: { product: { include: { images: true } } } },
    },
  });

  if (!existingCart) {
    const newCart = await prisma.cart.create({
      data: { userId: user.id },
      include: {
        items: { include: { product: { include: { images: true } } } },
      },
    });

    c.set("cart", newCart);
    await next();
  } else {
    c.set("cart", existingCart);
    await next();
  }
});
