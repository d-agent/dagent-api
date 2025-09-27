import { Hono } from "hono";
import devRoute from "./dev.route";

const app = new Hono();

app.route('/', devRoute);

export default app;