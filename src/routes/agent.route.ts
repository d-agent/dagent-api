import { Hono } from "hono";
import { AgentController } from "../controllers/agent.controller";
import verifyApiKey from "../middlewares/verifyApiEth.middleware";

const app = new Hono();

app.post("/", verifyApiKey, AgentController.primary);
app.post("/verify", AgentController.verifyAgent);
app.post("/create", AgentController.createAgent);
app.get("/all", AgentController.getAllAgents);
app.post("/:id/run", AgentController.runAgent);
app.get("/:id", AgentController.getAgent);
app.put("/:id", AgentController.updateAgent);
app.delete("/:id", AgentController.deleteAgent);

export default app;
