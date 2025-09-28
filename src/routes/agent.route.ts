import { Hono } from 'hono';
import { AgentController } from '../controllers/agent.controller';
import verifyApiKey from '../middlewares/verifyApiEth.middleware';


const app = new Hono();

app.post('/', verifyApiKey, AgentController.primary);
app.post('/create', AgentController.createAgent);

export default app;