import { Context } from "hono";
import { AuthService } from "../services/auth.service";
import { DataSignature } from "@meshsdk/core";

export class AuthController {
    public static readonly sendNonce = async (c: Context) => {
        try {
            const { address } = await c.req.json();

            if (!address || typeof address !== "string") {
                return c.json({
                    error: "address is required and must be a string"
                }, 400);
            }

            const result = await AuthService.sendNonce(address);
            return c.json(result);
        } catch (error) {
            return c.json({
                error: "Failed to generate nonce",
                message: error instanceof Error ? error.message : 'Unknown error'
            }, 500);
        }
    };

    public static readonly verifyNonce = async (c: Context) => {
        try {
            const { address, signature } = await c.req.json();

            if (!address || typeof address !== "string") {
                return c.json({
                    error: "userAddress is required and must be a string"
                }, 400);
            }

            if (!signature) {
                return c.json({ error: "signature is required" }, 400);
            }

            const result = await AuthService.verifyNonce(c, address, signature as DataSignature);
            return c.json(result);
        } catch (error) {
            return c.json({
                error: "Verification failed",
                message: error instanceof Error ? error.message : 'Unknown error'
            }, 500);
        }
    };
}
