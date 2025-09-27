import { Context } from "hono";
import { ApiKeyService } from "../services/apiKey.service";

export class ApiKeyController {
    public static readonly createApiKey = async (c: Context) => {
        const { api_key_name } = await c.req.json()
        const user = await c.get('user')
        const apiKey = await ApiKeyService.createApiKey(user.id, api_key_name)
        return c.json(apiKey)
    }

    public static readonly updateApiKey = async (c: Context) => {
        const { api_key_id } = await c.req.json()
        const user = await c.get('user')
        const apiKey = await ApiKeyService.updateApiKey(api_key_id, user.id);
        return c.json(apiKey)
    }

    public static readonly deleteApiKey = async (c: Context) => {
        const { api_key_id } = await c.req.json()
        const apiKey = await ApiKeyService.deleteApiKey(api_key_id)
        return c.json(apiKey)
    }
}