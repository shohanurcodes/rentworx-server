import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(5000),

  MONGODB_URI: z.string().trim().default(""),

  CLIENT_URL: z.url().default("http://localhost:3000"),

  AUTH_JWKS_URL: z.url().default("http://localhost:3000/api/auth/jwks"),
  AUTH_ISSUER: z.url().default("http://localhost:3000"),
  AUTH_AUDIENCE: z.url().default("http://localhost:3000"),

  STRIPE_SECRET_KEY: z.string().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().default(""),
  IMGBB_API_KEY: z.string().default(""),

  ADMIN_EMAIL: z.email().default("admin@rentworx.test"),
  ADMIN_PASSWORD: z.string().min(6).default("Admin123"),
  OWNER_EMAIL: z.email().default("owner@rentworx.test"),
  OWNER_PASSWORD: z.string().min(6).default("Owner123"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid server environment variables:");
  console.error(z.treeifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;

export const allowedOrigins = env.CLIENT_URL.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const isProduction = env.NODE_ENV === "production";
