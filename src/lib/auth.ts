import { betterAuth } from "better-auth";
import { apiKey } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";

const pool = prismaAdapter(prisma, {
  provider: 'postgresql'
});

export const auth = betterAuth({
  database: pool,
  plugins: [apiKey()],
});
