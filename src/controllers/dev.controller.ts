import { Context } from "hono";
import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();


export class DevController {
    public static readonly getHealthController = async (c: Context) => {
        return c.json({ message: 'Health check successful' });
    }

    public static readonly testDbController = async (c: Context) => {
        try {
            // Test database connection by trying to count users
            const userCount = await prisma.user.count();
            return c.json({
                message: 'Database connection successful',
                userCount: userCount
            });
        } catch (error) {
            return c.json({
                message: 'Database connection failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            }, 500);
        }
    }
}