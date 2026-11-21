import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(5000),

  MONGODB_URI: z.string().trim().default(""),

  CLIENT_URL: z.string().trim().min(1).default("http://localhost:3000"),

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

const originSchema = z.url();
const invalidOrigins = allowedOrigins.filter(
  (origin) => !originSchema.safeParse(origin).success,
);

if (invalidOrigins.length) {
  console.error("Invalid CLIENT_URL origin(s):", invalidOrigins.join(", "));
  process.exit(1);
}

const isProduction = env.NODE_ENV === "production";

function isLocalUrl(value: string) {
  const hostname = new URL(value).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1";
}

if (isProduction) {
  const problems: string[] = [];

  if (!env.MONGODB_URI) problems.push("MONGODB_URI is required");
  if (allowedOrigins.some(isLocalUrl)) {
    problems.push("CLIENT_URL must be the deployed client URL");
  }
  if (isLocalUrl(env.AUTH_JWKS_URL)) {
    problems.push("AUTH_JWKS_URL must point to the deployed client");
  }
  if (isLocalUrl(env.AUTH_ISSUER)) {
    problems.push("AUTH_ISSUER must point to the deployed client");
  }
  if (isLocalUrl(env.AUTH_AUDIENCE)) {
    problems.push("AUTH_AUDIENCE must point to the deployed client");
  }

  if (problems.length) {
    console.error("Invalid production environment configuration:");
    problems.forEach((problem) => console.error(`- ${problem}`));
    process.exit(1);
  }

  if (!env.STRIPE_SECRET_KEY) {
    console.warn("STRIPE_SECRET_KEY is not set; checkout will be unavailable.");
  }
  if (!env.STRIPE_WEBHOOK_SECRET) {
    console.warn(
      "STRIPE_WEBHOOK_SECRET is not set; webhook events cannot be verified.",
    );
  }
  if (!env.IMGBB_API_KEY) {
    console.warn("IMGBB_API_KEY is not set; image uploads will be unavailable.");
  }
}

export { isProduction };
