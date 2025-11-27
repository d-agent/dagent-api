import { Context, Next } from "hono";
import { config } from "../lib/env";
import { decode, verify } from "hono/jwt";

interface JwtPayload {
    payload: {
        sub: string;
        role: string;
    };
}

const verifyJwt = async (c: Context, next: Next): Promise<void | Response> => {
    const authHeader = await c.req.header("Authorization");

    if (!authHeader) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    // Extract token from "Bearer <token>" format
    const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : authHeader;

    try {
        const isValid = await verify(token, config.JWT_SECRET, { alg: 'HS256' });
        if (!isValid) {
            return c.json({ error: "Unauthorized" }, 401);
        }
        const { payload } = decode(token) as unknown as { payload: JwtPayload };

        c.set("user", { id: payload.payload.sub, role: payload.payload.role });

        return next();
    } catch (error) {
        console.error('error', error)
        return c.json({ error: "Invalid token" }, 401);
    }
};

export default verifyJwt;
