import { callProxiedAgent, CloudFlareEmbeddingFunction, generateEmbedding } from "../lib/utils/helper";
import { getToto, matchAgents, matchAgentsV2 } from "../lib/utils";
import { AgentFrameWorks, Requirement } from "../types";
import { Context } from "hono";
import { setCookie } from "hono/cookie";
import { prisma } from "../lib/db";
import { agentContract } from "../lib/contracts/eth/agent.contract";
import { agentApi } from "../lib/agents";
import { SessionService } from "./session.service";

export class AgentService {
	public static readonly primary = async (
		ctx: Context,
		data: {
			requirement_json?: Requirement;
			agent_id?: string;
			message: string;
		}
	): Promise<any> => {
		const api_key = await ctx.get("api_key");

		const session_id = crypto.randomUUID();

		if (data.agent_id) {
			const agent = await prisma.agent.findUnique({
				where: {
					id: data.agent_id,
				},
				include: {
					user: {
						include: {
							walletAddress: true,
						},
					},
				},
			});

			if (!agent?.deployedUrl || !agent?.llmProvider || !agent?.userId) {
				throw new Error("Agent URL or provider not found");
			}

			const response = await callProxiedAgent(
				agent.deployedUrl,
				agent.default_agent_name || "",
				(agent.framework_used as AgentFrameWorks) || AgentFrameWorks.google_adk,
				data.message,
				session_id,
				agent.userId
			);

			// if (!response.input_tokens || !response.output_tokens) {
			//     throw new Error("No input tokens and output token found")
			// }

			// await handleAgentPayment({ agentCost: agent.agentCost, agentInputTokenCost: agent.inputTokenCost, agentOutputTokenCost: agent.outputTokenCost, userWalletAddress: agent.user.walletAddress?.address || "", inputTokenUsed: response.input_tokens, outputTokenUsed: response.output_tokens, api_key: ctx.get("api_key") });

			return response.response_content;
		} else if (data.requirement_json) {
			const matched_agents = await matchAgentsV2(data.requirement_json, 5);
			if (!matched_agents || !matched_agents[0].deployedUrl) {
				throw new Error("Agent not found");
			}
			const response = await callProxiedAgent(
				matched_agents[0].deployedUrl,
				matched_agents[0].default_agent_name || "",
				(matched_agents[0].framework_used as AgentFrameWorks) ||
				AgentFrameWorks.google_adk,
				data.message,
				session_id,
				api_key.userId
			);

			// if (!response.input_tokens || !response.output_tokens) {
			//     throw new Error("No input tokens and output token found");
			// }

			// await handleAgentPayment({
			//     agentCost: matched_agent[0].agentCost,
			//     agentInputTokenCost: matched_agent[0].inputTokenCost,
			//     agentOutputTokenCost: matched_agent[0].outputTokenCost,
			//     userWalletAddress: matched_agent[0].user.walletAddress?.address || "",
			//     inputTokenUsed: response.input_tokens,
			//     outputTokenUsed: response.output_tokens,
			//     api_key: ctx.get("api_key"),
			// });

			// console.log("matched_agent", matched_agents[0]);
			// Store agent_id in Redis for session persistence
			await SessionService.setAgentId(api_key.userId, api_key.id, matched_agents[0].id);
			return response.response_content;
		} else {
			throw new Error("No agent ID or requirement JSON provided");
		}
	};

	public static readonly verifyAgent = async (
		uri: string,
		agent_name: string
	) => {
		const apps = await agentApi.getApp(uri);
		if (!apps) {
			throw new Error("Invalid agent URI");
		}
		if (!apps.includes(agent_name)) {
			throw new Error("Agent name not found in the deployed URL");
		}
		return true;
	};

	public static readonly createAgent = async (
		user_id: string,
		{
			name,
			description,
			agentCost,
			deployedUrl,
			llmProvider,
			skills,
			is_multiAgentSystem,
			default_agent_name,
			framework_used,
			can_stream,
		}: {
			name: string;
			description: string;
			agentCost: string;
			deployedUrl: string;
			llmProvider: string;
			skills: string[];
			is_multiAgentSystem: boolean;
			default_agent_name: string;
			framework_used: string;
			can_stream: boolean;
		}
	) => {
		const embedding = await new CloudFlareEmbeddingFunction().generate([description]);
		const agent = await prisma.agent.create({
			data: {
				name,
				description,
				agentCost,
				deployedUrl,
				llmProvider,
				framework_used,
				can_stream,
				default_agent_name,
				is_multiAgentSystem,
				skills,
				isActive: true,
				user: { connect: { id: user_id } },
				embedding: embedding[0],
				isPublic: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		});
		// await agentContract.registerAgent({
		// 	ownerId: user_id,
		// 	agentIdHash: agent.id,
		// 	agentAddress: agent.deployedUrl,
		// });

		const toto = await getToto()

		const stringifiedReqBody = JSON.stringify({
			name: agent.name,
			description: agent.description,
			agentCost: agent.agentCost,
			llmProvider: agent.llmProvider,
			skills: agent.skills,
		})

		// added to toto chrom collection with cf embeddings
		toto.add({
			ids: [agent.id],
			metadatas: [{
				name: agent.name,
				description: agent.description,
				agentCost: agent.agentCost,
				deployedUrl: agent.deployedUrl,
				llmProvider: agent.llmProvider,
			}],
			documents: [stringifiedReqBody],
			embeddings: embedding,
		})


		return agent;
	};

	public static readonly getAllAgents = async (user_id?: string) => {
		const where = user_id ? { userId: user_id } : { isPublic: true };

		const agents = await prisma.agent.findMany({
			where,
			select: {
				id: true,
				name: true,
				description: true,
				agentCost: true,
				deployedUrl: true,
				llmProvider: true,
				isActive: true,
				isPublic: true,
				createdAt: true,
				updatedAt: true,
				user: {
					select: {
						id: true,
						walletAddress: {
							select: {
								address: true,
							},
						},
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		return agents;
	};

	public static readonly getAgent = async (agent_id: string) => {
		const agent = await prisma.agent.findUnique({
			where: { id: agent_id },
			include: {
				user: {
					select: {
						id: true,
						walletAddress: {
							select: {
								address: true,
							},
						},
					},
				},
			},
		});

		if (!agent) {
			throw new Error("Agent not found");
		}

		return agent;
	};

	public static readonly updateAgent = async (
		agent_id: string,
		user_id: string,
		updateData: {
			name?: string;
			description?: string;
			agentCost?: string;
			deployedUrl?: string;
			llmProvider?: string;
			isActive?: boolean;
			isPublic?: boolean;
		}
	) => {
		// First check if the agent exists and user has permission
		const existingAgent = await prisma.agent.findUnique({
			where: { id: agent_id },
		});

		if (!existingAgent) {
			throw new Error("Agent not found");
		}

		if (existingAgent.userId !== user_id) {
			throw new Error("Unauthorized to update this agent");
		}

		// If description is being updated, regenerate embedding
		let embedding = existingAgent.embedding;
		if (
			updateData.description &&
			updateData.description !== existingAgent.description
		) {
			embedding = await generateEmbedding(updateData.description);
		}

		const agent = await prisma.agent.update({
			where: { id: agent_id },
			data: {
				...updateData,
				embedding,
				updatedAt: new Date(),
			},
		});

		return agent;
	};

	public static readonly deleteAgent = async (
		agent_id: string,
		user_id: string
	) => {
		// First check if the agent exists and user has permission
		const existingAgent = await prisma.agent.findUnique({
			where: { id: agent_id },
		});

		if (!existingAgent) {
			throw new Error("Agent not found");
		}

		if (existingAgent.userId !== user_id) {
			throw new Error("Unauthorized to delete this agent");
		}

		const agent = await prisma.agent.delete({
			where: { id: agent_id },
		});

		return agent;
	};
}
