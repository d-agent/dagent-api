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

export const auth = betterAuth({
  database: pool,
  baseURL: config.FRONTEND_URL,
  advanced: {
    crossSubDomainCookies: {
      enabled: true
    }
  },
  plugins: [
    siwe({
      domain: "myapp.com", //FIXME: CHANGE TO CONFIG.FRONTEND_URL
      anonymous: true, // allow sign-in without email
      getNonce: async () => {
        // Generate a secure random nonce
        return generateRandomString(32);
      },
      verifyMessage: async ({ message, signature, address }) => {
        try {
          // Verify the signed SIWE message
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

