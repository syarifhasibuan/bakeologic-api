import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { PrivateUserSchema, PublicUserSchema } from "../modules/user/schema";
import { ResponseErrorSchema } from "../modules/common/schema";
import { prisma } from "../lib/prisma";
import {
  RequestLoginSchema,
  RequestRegisterSchema,
  ResponseLoginSchema,
} from "../modules/auth/schema";
import { hashPassword, verifyPassword } from "../lib/password";
import { signToken, verifyToken } from "../lib/token";

export const authRoute = new OpenAPIHono();

const tags = ["auth"];

// POST /auth/register
authRoute.openapi(
  createRoute({
    tags,
    summary: "Register new user",
    method: "post",
    path: "/register",
    request: {
      body: {
        description: "Register new user",
        content: { "application/json": { schema: RequestRegisterSchema } },
      },
    },
    responses: {
      200: {
        description: "Successfully registered new user",
        content: { "application/json": { schema: PublicUserSchema } },
      },
      500: {
        description: "Failed to register new user",
        content: { "application/json": { schema: ResponseErrorSchema } },
      },
    },
  }),
  async (c) => {
    try {
      const { password, ...body } = c.req.valid("json");

      const hash = await hashPassword(password);

      const newUser = await prisma.user.create({
        data: {
          ...body,
          avatarUrl: `https://api.dicebear.com/9.x/open-peeps/svg?seed=${body.username}`,
          password: { create: { hash } },
        },
        omit: { email: true, phoneNumber: true },
      });
      return c.json(newUser, 200);
    } catch (error) {
      console.error(error);
      return c.json({ message: "Failed to register new user", error }, 500);
    }
  }
);

// POST /auth/login
authRoute.openapi(
  createRoute({
    tags,
    summary: "Login user",
    method: "post",
    path: "/login",
    request: {
      body: {
        description: "Login user",
        content: { "application/json": { schema: RequestLoginSchema } },
      },
    },
    responses: {
      200: {
        description: "Successfully registered new user",
        content: {
          "application/json": { schema: ResponseLoginSchema },
        },
      },
      400: {
        description: "Failed to register new user",
        content: { "application/json": { schema: ResponseErrorSchema } },
      },
      500: {
        description: "Failed to register new user",
        content: { "application/json": { schema: ResponseErrorSchema } },
      },
    },
  }),
  async (c) => {
    try {
      const { password, ...body } = c.req.valid("json");

      const user = await prisma.user.findUnique({
        where: { username: body.username },
        include: { password: true },
        omit: { email: true, phoneNumber: true },
      });
      if (!user) {
        return c.json(
          { message: `Username "${body.username}" is not found` },
          400
        );
      }

      const hash = user.password?.hash;
      if (!hash) return c.json({ message: "User has no password" }, 400);

      const isVerified = await verifyPassword(hash, password);
      if (!isVerified) {
        return c.json({ message: "Sorry, password was incorrect." }, 400);
      }

      const { password: _, ...userWithoutPassword } = user;

      const token = await signToken(user.id);

      c.header("Token", token);

      return c.json({ user: userWithoutPassword, token }, 200);
    } catch (error) {
      console.error(error);
      return c.json({ message: "Failed to register new user", error }, 500);
    }
  }
);

// DELETE /auth/users
// authRoute.openapi(
//   createRoute({
//     tags,
//     summary: "Delete all users",
//     method: "delete",
//     path: "/users",
//     responses: {
//       200: {
//         description: "Successfully deleted all users",
//         content: {
//           "application/json": { schema: z.object({ message: z.string() }) },
//         },
//       },
//       500: {
//         description: "Failed to delete all users",
//         content: { "application/json": { schema: ResponseErrorSchema } },
//       },
//     },
//   }),
//   async (c) => {
//     try {
//       await prisma.user.deleteMany();
//       return c.json({ message: "Successfully deleted all users" }, 200);
//     } catch (error) {
//       console.error(error);
//       return c.json({ message: "Failed to delete users", error }, 500);
//     }
//   }
// );
