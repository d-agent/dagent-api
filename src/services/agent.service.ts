import { callProxiedAgent, generateEmbedding } from "../lib/utils/helper";
import { matchAgents } from "../lib/utils";
import { AgentFrameWorks, Requirement } from "../types";
import { Context } from "hono";
import {
    setCookie
} from 'hono/cookie';
import { prisma } from "../lib/db";
import { agentContract } from "../lib/contracts/agent.contract";

export class AgentService {

    public static readonly primary = async (ctx: Context, requirement_json: Requirement, agent_id?: string, message: string = ""): Promise<any> => {
        const api_key = await ctx.get('api_key')
        console.log('hugabuga', api_key)
        console.log('reqqqqq', requirement_json)
        // Generate a new UUID for session ID
        const session_id = crypto.randomUUID()

        console.log('session_id', session_id)
        if (agent_id) {
            const agent = await prisma.agent.findUnique({
                where: {
                    id: agent_id
                },
                include: {
                    user: {
                        include: {
                            walletAddress: true
                        }
                    }
                }
            })
            if (!agent?.deployedUrl || !agent?.llmProvider || !agent) {
                throw new Error("Agent URL or provider not found")
            }

            const agent_framework = agent.framework_used || AgentFrameWorks.google_adk

            const response = await callProxiedAgent(agent.deployedUrl, AgentFrameWorks.google_adk, message, session_id, api_key.userId)


            // if (!response.input_tokens || !response.output_tokens) {
            //     throw new Error("No input tokens and output token found")
            // }

            // await handleAgentPayment({ agentCost: agent.agentCost, agentInputTokenCost: agent.inputTokenCost, agentOutputTokenCost: agent.outputTokenCost, userWalletAddress: agent.user.walletAddress?.address || "", inputTokenUsed: response.input_tokens, outputTokenUsed: response.output_tokens, api_key: ctx.get("api_key") });


            return response.response_content
        } else {

            const matched_agent = await matchAgents(requirement_json, 5)
            if (!matched_agent || !matched_agent[0].deployedUrl) {
                throw new Error("Agent not found")
            }
            const response = await callProxiedAgent(matched_agent[0].deployedUrl, AgentFrameWorks.google_adk, message, session_id, api_key.userId)

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
            console.log('matched_agent', matched_agent[0])
            setCookie(ctx, "agent_id", matched_agent[0].id)
            return response.response_content
        }
    }

    public static readonly createAgent = async (
        user_id: string,
        { name,
            description,
            agentCost,
            deployedUrl,
            llmProvider,
            skills,
            is_multiAgentSystem,
            default_agent_name,
            framework_used,
            can_stream
        }: {
            name: string, description: string, agentCost: string, deployedUrl: string, llmProvider: string, skills: string[], is_multiAgentSystem: boolean, default_agent_name: string, framework_used: string, can_stream: boolean
        }

    ) => {
        const embedding = await generateEmbedding(description)
        const agent = await prisma.agent.create({
            data: {
                name, description,
                agentCost,
                deployedUrl,
                llmProvider,
                isActive: true,
                user: { connect: { id: user_id } },
                embedding,
                isPublic: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        })
        await agentContract.registerAgent({
            ownerId: user_id, 
            agentIdHash: agent.id,
            agentAddress: agent.deployedUrl
        });

        return agent;
    }
}