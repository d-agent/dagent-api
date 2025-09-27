import { Context } from "hono";

export class DevController {
    public static readonly getHealthController = async (c: Context) => {
        return c.json({ message: 'Health check successful' });
    }
}