import { z } from 'zod';

export const env = z.object({
    BETTER_AUTH_SECRET: z.string(),
    BETTER_AUTH_URL: z.url(),
    FRONTEND_URL: z.string(),
    DATABASE_URL: z.url(),
    CLOUDFLARE_ACCOUNT_ID: z.string(),
    CLOUDFLARE_API_TOKEN: z.string()

})

export const config = env.parse(process.env)