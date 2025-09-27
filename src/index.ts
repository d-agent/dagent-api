import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { auth } from './lib/auth';
import { config } from './lib/env';
import { showRoutes } from 'hono/dev';
import Routes from './routes/index';
import { logger } from 'hono/logger';
import { poweredBy } from 'hono/powered-by';
import { prettyJSON } from 'hono/pretty-json';

const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null
  }
}>();

app.use(prettyJSON());
app.use(poweredBy());
app.use(logger());

app.use(
  "*", // or replace with "*" to enable cors for all routes
  cors({
    origin: config.FRONTEND_URL, // replace with your origin
    allowHeaders: ["Content-Type", "Authorization", "x-api-key"],
    allowMethods: ["POST", "GET", "OPTIONS", "PUT", "DELETE"],
    exposeHeaders: ["Content-Length", "x-api-key"],
    maxAge: 600,
    credentials: true,
  }),
);

app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    c.set("user", null);
    c.set("session", null);
    return next();
  }


  c.set("user", session.user);
  c.set("session", session.session);
  return next();
});

app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

app.route('/', Routes);

showRoutes(app);

export default app
