import { id } from "ethers";
import { auth } from "../lib/auth";
import { getUserAddressBalance } from "../lib/utils/helper";
import { prisma } from "../lib/db";

export class ApiKeyService {
	public static readonly createApiKey = async (
		user_id: string,
		api_key_name: string
	) => {
		//TODO: Fix the current stake issue
		// const current_stake = await getUserAddressBalance(user_id);
		const current_stake = 1000
		const apiKey = await auth.api.createApiKey({
			body: {
				name: api_key_name,
				userId: user_id, // server-only
				prefix: "ua-",
				remaining: Number(current_stake), // server-only
				// metadata: { someKey: 'someValue' },
				// refillAmount: 100, // server-only
				// refillInterval: 1000, // server-only
				// rateLimitTimeWindow: 1000, // server-only
				// rateLimitMax: 100, // server-only
				rateLimitEnabled: false, // server-only
			},
		});
		return apiKey;
	};

	public static readonly updateApiKey = async (
		api_key_id: string,
		user_id: string
	) => {
		const current_stake = await getUserAddressBalance(user_id);

		const apiKey = await auth.api.updateApiKey({
			body: {
				keyId: api_key_id,
				remaining: Number(current_stake),
			},
		});
		return apiKey;
	};

	public static readonly deleteApiKey = async (api_key_id: string) => {
		const apiKey = await prisma.apikey.delete({
			where: {
				id: api_key_id
			}
		});
		if (!apiKey) {
			throw new Error("API Key not found");
		}

		return apiKey.id;
	};

	public static readonly getAllApiKeys = async (user_id: string) => {
		// Use direct database query since better-auth might not have getApiKeys
		const { prisma } = await import("../lib/db");
		const apiKeys = await prisma.apikey.findMany({
			where: {
				userId: user_id,
			},
			select: {
				id: true,
				name: true,
				prefix: true,
				key: true,
				remaining: true,
				rateLimitEnabled: true,
				createdAt: true,
				updatedAt: true,
			},
		});
		return apiKeys;
	};
}
