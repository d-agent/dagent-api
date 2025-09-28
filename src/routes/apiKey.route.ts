import { Hono } from 'hono';
import { ApiKeyController } from '../controllers/apiKey.controller';
4

const app = new Hono();

app.post('/create', ApiKeyController.createApiKey);
app.put('/update', ApiKeyController.updateApiKey);
app.delete('/delete', ApiKeyController.deleteApiKey);

export default app;