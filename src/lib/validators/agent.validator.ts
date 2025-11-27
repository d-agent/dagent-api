import z from "zod";

export const agentCreateSchema = z.object({
	name: z.string(),
	description: z.string(),
	agentCost: z.number(),
	deployedUrl: z.string().url(),
	llmProvider: z.string(),
	skills: z.array(z.string()),
	is_multiAgentSystem: z.boolean(),
	default_agent_name: z.string().optional(),
	framework_used: z.string(),
	can_stream: z.boolean(),
});

export type IAgentCreate = z.infer<typeof agentCreateSchema>;

export const agentNameVerificationSchema = z.object({
	default_agent_name: z.string(),
	deployedUrl: z.string().url(),
});

export type IAgentNameVerification = z.infer<
	typeof agentNameVerificationSchema
>;
