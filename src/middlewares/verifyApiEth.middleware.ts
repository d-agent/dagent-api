import { Context, Next } from "hono";
import { auth } from "../lib/auth";

const verifyApiKey = async (c: Context, next: Next): Promise<void | Response> => {
    const apiKey = c.req.header("x-api-key");

    if (!apiKey) {
        return c.json({ error: "API key is required" }, 400);
    }

    try {
        const data = await auth.api.verifyApiKey({
            body: { key: apiKey },
        });

        if (data.valid) {
            c.set("api_key", data.key);
            return next();
        }

        return c.json({ error: "Invalid API key" }, 401);
    } catch {
        return c.json({ error: "API key verification failed" }, 401);
    }
};

export default verifyApiKey;
