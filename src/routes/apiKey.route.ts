import { Hono } from "hono";
import { ApiKeyController } from "../controllers/apiKey.controller";

const app = new Hono();

app.post("/create", ApiKeyController.createApiKey);
app.put("/update", ApiKeyController.updateApiKey);
app.delete("/delete", ApiKeyController.deleteApiKey);
app.get("/all", ApiKeyController.getAllApiKeys);

export default app;
