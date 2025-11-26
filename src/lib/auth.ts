import { betterAuth } from "better-auth";
import { apiKey, siwe } from "better-auth/plugins";
import { generateRandomString } from "better-auth/crypto";
import { verifyMessage } from "viem";
import { config } from "./env";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";

const pool = prismaAdapter(prisma, {
  provider: 'postgresql'
})

// Extract hostname from frontend URL for SIWE domain
const frontendHostname = new URL(config.FRONTEND_URL).hostname;

export const auth = betterAuth({
  database: pool,
  baseURL: config.FRONTEND_URL,
  trustedOrigins: [config.FRONTEND_URL], // Trust your frontend
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
    },
    // Allow cross-origin requests with credentials
    defaultCookieAttributes: {
      sameSite: "none", // Required for cross-origin
      secure: true, // Required when sameSite is "none"
      httpOnly: true,
    },
  },
  plugins: [
    siwe({
      domain: frontendHostname, // Use actual frontend hostname
      anonymous: true,
      getNonce: async () => {
        return generateRandomString(32);
      },
      verifyMessage: async ({ message, signature, address }) => {
        try {
          return await verifyMessage({
            address: address as `0x${string}`,
            message,
            signature: signature as `0x${string}`,
          });
        } catch (err) {
          console.error("Signature verification failed:", err);
          return false;
        }
      },
    }),
    apiKey()
  ],
});