import { Hono } from "hono";
import devRoute from "./dev.route";
import agentRoute from "./agent.route";
import apiKeyRoute from "./apiKey.route";
import authRoute from "./auth.route";
import verifyJwt from "../middlewares/jwt.middleware";

const app = new Hono();

// Public routes (no auth required)
app.route('/auth', authRoute);
app.route('/', devRoute);
app.route('/dagent', agentRoute);

// Protected routes (JWT required)
app.use(verifyJwt);
app.route('/apikey', apiKeyRoute);

export default app;
