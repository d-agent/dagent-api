import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { config } from './lib/env';
import { showRoutes } from 'hono/dev';
import Routes from './routes/index';
import { logger } from 'hono/logger';
import { poweredBy } from 'hono/powered-by';
import { prettyJSON } from 'hono/pretty-json';

interface JWTPayload {
  sub: string;
  role: string;
  exp: number;
}

const app = new Hono<{
  Variables: {
    user: JWTPayload | null;
  }
}>();

app.use(prettyJSON());
app.use(poweredBy());
app.use(logger());

app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "https://dagent.dev", "https://web.dagent.dev", "https://www.dagent.dev"],
    allowHeaders: ["Content-Type", "Authorization", "x-api-key"],
    allowMethods: ["POST", "GET", "OPTIONS", "PUT", "DELETE"],
    exposeHeaders: ["Content-Length", "x-api-key"],
    maxAge: 600,
    credentials: true,
  }),
);

app.route('/', Routes);

showRoutes(app);

export default app
