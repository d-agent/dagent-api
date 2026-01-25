import { z } from "zod";

export const env = z.object({
  BETTER_AUTH_SECRET: z.string(), // Required by better-auth for apiKey plugin
  FRONTEND_URL: z.string(),
  DATABASE_URL: z.url(),
  CLOUDFLARE_ACCOUNT_ID: z.string(),
  CLOUDFLARE_API_TOKEN: z.string(),
  JWT_SECRET: z.string(),
  UPSTASH_REDIS_REST_URL: z.string().optional(), // Upstash Redis REST URL
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(), // Upstash Redis REST Token
  CF_EMBEDDING_API_KEY: z.string(),
  CF_EMBEDDING_MODEL: z.string(),
  CF_ACCOUNT_ID: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REDIRECT_URI: z.string(),
});

export const config = env.parse(process.env);
