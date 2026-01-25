import { Hono } from "hono";
import { AuthController } from "../controllers/auth.controller";

const app = new Hono();

// app.post("/nonce", AuthController.sendNonce);
// app.post("/verify", AuthController.verifyNonce);
// app.post("/signin", AuthController.Signin);
// app.post("/signup", AuthController.Signup);
app.get("/google", AuthController.GoogleOAuth);
app.get("/google/callback", AuthController.GoogleCallback);

export default app;
