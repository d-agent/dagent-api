import { Hono } from "hono";
import devRoute from "./dev.route";
import agentRoute from "./agent.route";
import apiKeyRoute from "./apiKey.route";

const app = new Hono();

app.route('/', devRoute);
app.route('/dagent', agentRoute);
app.route('/apikey', apiKeyRoute);

export default app;