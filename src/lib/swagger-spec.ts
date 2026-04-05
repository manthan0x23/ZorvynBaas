import swaggerJSDoc from "swagger-jsdoc";
import { env } from "~/env";

import path from "path";
import fs from "fs";

const devPath = path.join(process.cwd(), "src/open-api");
const prodPath = path.join(process.cwd(), "open-api");

const docsPath = fs.existsSync(devPath) ? devPath : prodPath;

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "ZorvynBaaS API",
      version: "1.0.0",
      description: [
        "Cookie-session authenticated REST API.",
        "",
        "**Authentication flow:**",
        "1. `POST /api/auth/login` — server sets an HttpOnly `session_id` cookie.",
        "2. All subsequent requests are authenticated via that cookie automatically.",
        "3. `POST /api/auth/logout` to end the session.",
        "",
        "> When testing in Swagger UI, log in first — the browser persists the cookie for you.",
      ].join("\n"),
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}/api`,
      },
    ],
    components: {
      securitySchemes: {
        cookieSession: {
          type: "apiKey",
          in: "cookie",
          name: "session_id",
          description: "HttpOnly session cookie set by POST /api/auth/login.",
        },
      },

      responses: {
        Unauthorized: {
          description: "Missing, expired, or invalid session cookie.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: {
                ok: false,
                code: "UNAUTHORIZED",
                message: "No active session",
              },
            },
          },
        },
        Forbidden: {
          description: "Authenticated user lacks the required permission.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: {
                ok: false,
                code: "FORBIDDEN",
                message: "Access denied",
              },
            },
          },
        },
        NotFound: {
          description: "Resource not found.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: {
                ok: false,
                code: "NOT_FOUND",
                message: "Resource not found",
              },
            },
          },
        },
        ValidationError: {
          description: "Request body or query params failed schema validation.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: {
                ok: false,
                code: "VALIDATION_ERROR",
                message: "email: Invalid email",
              },
            },
          },
        },
        RateLimited: {
          description: "Too many requests.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: {
                ok: false,
                code: "RATE_LIMITED",
                message: "Too many requests",
              },
            },
          },
        },
      },
    },
    security: [{ cookieSession: [] }],
  },
  apis: [`${docsPath}/**/*.yml`],
});
