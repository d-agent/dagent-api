import { checkSignature, DataSignature, generateNonce } from "@meshsdk/core";
import { prisma } from "../lib/db";
import { NONCE_MESSAGE } from "../lib/utils/constants";
import { decode, sign, verify } from "hono/jwt";
import { config } from "../lib/env";
import { setCookie } from "hono/cookie";
import { Context } from "hono";
import GoogleOAuth, { googleOAuth } from "../lib/google";

export class AuthService {
  public static readonly GoogleSignin = async (c: Context) => {
    const { authUrl, state } = googleOAuth.getAuthUrl();
    if (!authUrl || !state) {
      throw new Error("Unable to generatte oauth url");
    }
    return { url: authUrl };
  };

  public static readonly GoogleCallback = async (
    c: Context,
    code: string,
    state: string,
  ) => {
    try {
      const tokens = await googleOAuth.getTokens(code);
      console.log("tokens ala", tokens);

      if (!tokens || !tokens.access_token) {
        throw new Error("Failed to retrieve Google tokens.");
      }
      const profile = await googleOAuth.fetchProfile(tokens.access_token);
      if (!profile || !profile.email) {
        throw new Error("Failed to retrieve user info from Google.");
      }
      console.log("Profilee", profile);

      const user = await prisma.user.upsert({
        where: { email: profile.email },
        update: {
          name: profile.name,
          image: profile.profilePic,
        },
        create: {
          name: profile.name,
          email: profile.email,
          image: profile.profilePic,
          emailVerified: true,
        },
      });
      const payload = {
        sub: user.id,
        role: "user",
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
      };
      const token = await sign(
        {
          payload,
          alg: "HS256",
        },
        config.JWT_SECRET,
      );
      setCookie(c, "token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 30,
      });
      return { token: token, userId: user.id };
    } catch (error) {
      console.log(error);
    }
  };
}
