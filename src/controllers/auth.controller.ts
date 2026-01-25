import { Context } from "hono";
import { AuthService } from "../services/auth.service";
import { DataSignature } from "@meshsdk/core";

export class AuthController {
  public static readonly GoogleOAuth = async (c: Context) => {
    try {
      const { url } = await AuthService.GoogleSignin(c);
      return c.redirect(url);
    } catch (error) {
      return c.json(
        {
          error: "Failed to generate OauthURl",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        500,
      );
    }
  };
  public static readonly GoogleCallback = async (c: Context) => {
    try {
      const { code, state } = c.req.query();
      console.log("code, " ,code)
      if (!code || !state) {
        return c.json(
          {
            error: "Authorization code or state is missing",
          },
          400,
        );
      }

      const user = await AuthService.GoogleCallback(c, code, state);
      return c.json({ message: "User signed in" });
    } catch (error) {
      return c.json(
        {
          error: "google Signin Failed",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        500,
      );
    }
  };
}
