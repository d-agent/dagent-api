import { Hono } from "hono";
import { AuthController } from "../controllers/auth.controller";

const app = new Hono();

app.post("/nonce", AuthController.sendNonce);
app.post("/verify", AuthController.verifyNonce);

export default app;
