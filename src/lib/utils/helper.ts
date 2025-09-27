import { AgentCard, AgentFrameWorks, GoogleADKRequestBody } from "../../types";
import { parseAgentResponse } from "./parser";
import { prisma } from "../db";
import { stakeContract } from "../contracts/stake.contract";
import { config } from "../env";
import { formatEther, parseEther } from "ethers";

export const callProxiedAgent = async (deployedUrl: string, agent_framework: AgentFrameWorks, message: string, session_id: string, user_id: string) => {
	//TODO: future scope call routes according to the deployment use (with agent_framework info)
	console.log('deeppppp', deployedUrl)
	console.log('session_id', session_id)
	console.log('user_id', user_id)

	let response: Response | undefined;

	switch (agent_framework) {
		case AgentFrameWorks.google_adk:
			const session = await fetch(
				`${deployedUrl}/apps/untangle-adk/users/${user_id}/sessions/${session_id}`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
				}
			);
			const session_json = await session.json();

			console.log('session', session_json)
			const requestBody: GoogleADKRequestBody = {
				appName: "untangle-adk",
				userId: user_id,
				sessionId: session_id,
				newMessage: {
					parts: [{
						text: message
					}],
					role: "user"
				},
				streaming: false,
				stateDelta: {}
			};
			response = await fetch(`${deployedUrl}/run`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(requestBody)
			});
			break;

		case AgentFrameWorks.crew_ai:
			// TODO: Implement crew_ai
			break;
		case AgentFrameWorks.langraph:
			// TODO: Implement langraph
			break;
		case AgentFrameWorks.openai:
			// TODO: Implement openai
			break;
		case AgentFrameWorks.autogen:
			// TODO: Implement autogen
			break;
		case AgentFrameWorks.autogpt:
			// TODO: Implement autogpt
			break;
		case AgentFrameWorks.semantic_kernel:
			// TODO: Implement semantic_kernel
			break;
		case AgentFrameWorks.openai_agents:
			// TODO: Implement openai_agents
			break;
		default:
			throw new Error(`Unsupported agent framework: ${agent_framework}`);
	}

	if (!response) {
		throw new Error(
			`Response not implemented for agent framework: ${agent_framework}`
		);
	}

	const json_response = await response.json()
	console.log('ddd', json_response)
	const parsedResponse = parseAgentResponse(agent_framework, json_response)
	return parsedResponse
}

export async function generateEmbedding(text: string): Promise<number[]> {
	const res = await fetch(
		`https://api.cloudflare.com/client/v4/accounts/${config.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/baai/bge-base-en-v1.5`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${config.CLOUDFLARE_API_TOKEN}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ text: [text] }),
		}
	);

	const data = await res.json();
	if (!res.ok) {
		throw new Error(`Cloudflare API error: ${JSON.stringify(data)}`);
	}

	return data.result.data[0];
}

export async function embedAgentCard(agent: AgentCard) {
	const text = `${agent.name}. ${agent.description
		}. Skills: ${agent.skills.join(", ")}.`;
	const embedding = await generateEmbedding(text);
	return embedding;
}

export function cosineSimilarity(a: number[], b: number[]) {
	// Validate inputs
	if (
		!Array.isArray(a) ||
		!Array.isArray(b) ||
		a.length === 0 ||
		b.length === 0
	) {
		return 0;
	}

	if (a.length !== b.length) {
		console.warn("Cosine similarity: arrays have different lengths");
		return 0;
	}

	// Check for any NaN or undefined values
	if (
		a.some((val) => isNaN(val) || val === undefined || val === null) ||
		b.some((val) => isNaN(val) || val === undefined || val === null)
	) {
		console.warn("Cosine similarity: arrays contain invalid values");
		return 0;
	}

	const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
	const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
	const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

	// Avoid division by zero
	if (normA === 0 || normB === 0) {
		return 0;
	}

	const result = dot / (normA * normB);

	// Ensure result is a valid number
	return isNaN(result) ? 0 : Math.max(-1, Math.min(1, result));
}

export async function handleAgentPayment({
	agentCost,
	agentInputTokenCost,
	agentOutputTokenCost,
	userWalletAddress,
	inputTokenUsed,
	outputTokenUsed,
	api_key,
}: {
	agentCost: string;
	agentInputTokenCost: number;
	agentOutputTokenCost: number;
	userWalletAddress: string;
	inputTokenUsed: number;
	outputTokenUsed: number;
	api_key: string;
}) {
	try {
		const key = await prisma.apikey.findUnique({
			where: { key: api_key },
			select: {
				user: {
					select: {
						walletAddress: {
							select: {
								address: true,
							},
						},
					},
				},
			},
		});

		if (
			!key ||
			!key.user ||
			!key.user.walletAddress ||
			!key.user.walletAddress.address
		) {
			throw new Error("User with api key not found!");
		}

		const totalCost =
			agentInputTokenCost * inputTokenUsed +
			agentOutputTokenCost * outputTokenUsed +
			Number(agentCost);

		const check = await stakeContract.getAddressStake(
			key.user.walletAddress.address as string
		);

		if (!check) {
			throw new Error("unable to fetch user stake, please try again later");
		}

		if (EthToWei(weiToEth(check.amount)) < totalCost) {
			throw new Error(
				"insufficient balance, please add more stake to your wallet"
			);
		}

		await stakeContract.transferEscrow({
			to: userWalletAddress,
			from: key.user.walletAddress.address,
			amount: totalCost.toString(),
		});

		return { success: true, totalCost };
	} catch (error) {
		console.error("Error handling agent payment:", error);
		throw new Error("Payment processing failed, please try again later.");
	}
}

/**
 * Convert Wei (BigInt) to readable ETH format
 * @param weiValue - The value in Wei as BigInt or string
 * @returns The formatted ETH value as string
 */
export function weiToEth(weiValue: bigint | string): string {
	try {
		const weiStr =
			typeof weiValue === "bigint" ? weiValue.toString() : weiValue;
		return formatEther(weiStr);
	} catch (error) {
		console.error("Error converting Wei to ETH:", error);
		return "0.0";
	}
}

/**
 * Convert Wei (BigInt) to readable ETH format
 * @param weiValue - The value in Wei as BigInt or string
 * @returns The formatted ETH value as string
 */
export function EthToWei(ethValue: string | number): bigint {
	try {
		const ethStr = typeof ethValue === "string" ? ethValue : ethValue.toString();
		return parseEther(ethStr);
	} catch (error) {
		console.error("Error converting ETH to Wei:", error);
		return BigInt(0);
	}
}

/**
 * Format ETH value for better readability
 * @param ethValue - ETH value as string or number
 * @param decimals - Number of decimal places (default: 6)
 * @returns Formatted ETH string
 */
export function formatEthValue(
	ethValue: string | number,
	decimals: number = 6
): string {
	const num = typeof ethValue === "string" ? parseFloat(ethValue) : ethValue;
	return num.toFixed(decimals);
}

export async function getUserAddressBalance(user_id: string) {
	const user = await prisma.walletAddress.findUnique({
		where: { userId: user_id },
		select: {
			address: true,
		},
	});

	if (!user) {
		throw new Error("wallet not found with this user");
	}

	const userStake = await stakeContract.getAddressStake(user.address);

	if (!userStake) {
		throw new Error("unable to fetch user stake, please try again later");
	}

	if (userStake.amount <= 0) {
		throw new Error("Current stake must be greater than 0");
	}
	return weiToEth(userStake.amount);
}
