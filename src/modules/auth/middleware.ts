import { createMiddleware } from "hono/factory";
import { TokenPayload, verifyToken } from "../../lib/token";
import { prisma } from "../../lib/prisma";
import { PublicUser } from "../user/schema";
import { jwt } from "hono/jwt";
import { ENV } from "../../env";

type Env = {
  Variables: {
    user: PublicUser;
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

  const token = authHeader.split(" ")[1];
  if (!token) {
    return c.json({ message: "Token not found" }, 401);
  }

  const payload = (await verifyToken(token)) as TokenPayload;
  if (!payload) {
    return c.json({ message: "Invalid token" }, 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    omit: { email: true, phoneNumber: true },
  });
  if (!user) {
    return c.json({ message: "User not found" }, 401);
  }

  c.set("user", user);

  await next();
});
