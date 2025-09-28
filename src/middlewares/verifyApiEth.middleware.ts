import { Context, Next } from "hono";
import { Middleware } from "better-auth/*";
import { auth } from "../lib/auth";

const verifyApiKey = async (c: Context, next: Next): Promise<Middleware> => {
    console.log('API Key verification middleware started')
    const api_key = c.req.header("x-api-key")
    if (!api_key) {
        console.log('No API key provided in headers')
        return c.json({ error: "API key is required" }, 400)
    }

    console.log('API key found:', api_key.substring(0, 10) + '...') // Log partial key for debugging

    try {
        const data = await auth.api.verifyApiKey({
            body: {
                key: api_key,
            },
        });

        if (data.valid) {
            //FIXME: ADD ESCROW AKA STAKE STATUS CHECK @adityatote
            c.set("api_key", data.key)
            console.log('API key is valid, proceeding to next middleware')
            await next()
        } else {
            console.log('API key is invalid. Key:', api_key.substring(0, 10) + '...')
            return c.json({ error: "Invalid API key" }, 401)
        }
    } catch (error) {
        console.error('API key verification failed with error:', error)
        return c.json({ error: "API key verification failed" }, 401)
    }
}

export default verifyApiKey