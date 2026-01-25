import { google, Auth } from "googleapis";
import crypto from "node:crypto";
import { config } from "../env";

interface GoogleUserProfile {
  email: string;
  name: string;
  profilePic: string;
}

class GoogleOAuth {
  private readonly client: Auth.OAuth2Client;
  private readonly scopes = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ];

  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this.client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  }

  public getAuthUrl(): { authUrl: string; state: string } {
    const state = crypto.randomBytes(32).toString("hex");
    const authUrl = this.client.generateAuthUrl({
      access_type: "offline",
      scope: this.scopes,
      include_granted_scopes: true,
      state,
    });
    return { authUrl, state };
  }

  public async getTokens(code: string) {
    const { tokens } = await this.client.getToken(code);
    if (!tokens.access_token) {
      throw new Error("Google OAuth: Failed to retrieve access token");
    }
    return tokens;
  }

  public async fetchProfile(accessToken: string): Promise<GoogleUserProfile> {
    // const oauth2 = google.oauth2({
    //   version: "v2",
    //   auth: accessToken,
    // });

    // const { data } = await oauth2.userinfo.get();
    // if (!data?.email) {
    //   throw new Error("Google OAuth: Invalid user info response");
    // }

    // console.log("user recievedd :",data)
    // return {
    //   email: data.email,
    //   name: data.name ?? "Anonymous",
    //   profilePic: data.picture ?? "",
    // };

    //  may require to change
    // const tempAuth = new google.auth.OAuth2();
    // tempAuth.setCredentials({ access_token: accessToken });
    // const oauth2 = google.oauth2({
    //   version: "v2",
    //   auth: tempAuth,
    // });
    const oauth2 = google.oauth2({
      version: "v2",
      auth: accessToken,
    });
    const { data } = await oauth2.userinfo.get();
    console.log("mee",data)
    if (!data?.email) {
      throw new Error("Google OAuth: Invalid user info response");
    }
    return {
      email: data.email,
      name: data.name ?? "Anonymous",
      profilePic: data.picture ?? "",
    };
  }
}

export const googleOAuth = new GoogleOAuth(
  config.GOOGLE_CLIENT_ID,
  config.GOOGLE_CLIENT_SECRET,
  config.GOOGLE_REDIRECT_URI,
);

export default GoogleOAuth;
