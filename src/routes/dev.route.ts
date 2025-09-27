import { Hono } from 'hono';
import { DevController } from '../controllers/dev.controller';


const app = new Hono();

app.all('/', DevController.getHealthController);
app.get('/health', DevController.getHealthController);

export default app;