import { PrismaClient } from "../../generated/prisma";
import { Requirement } from "../../types";
import { cosineSimilarity, generateEmbedding } from "./helper";

const prisma = new PrismaClient();

export async function matchAgents(requirement: Requirement, topN = 10) {
	const reqEmbedding = await generateEmbedding(requirement.description);
	const agents = await prisma.agent.findMany({
		where: {
			isActive: true,
			// agentCost: { lte: requirement.max_agent_cost.toString() },
		},
		take: topN * 3, // fetch a few more to account for scoring,
		include: {
			user: {
				include: {
					walletAddress: true,
				},
			},
		},
	});

	const scoredAgents = agents.map((agent) => {
		// Validate and calculate semantic score
		let semanticScore = 0;
		if (agent.embedding && Array.isArray(agent.embedding) && agent.embedding.length > 0) {
			try {
				const similarity = cosineSimilarity(reqEmbedding, agent.embedding);
				semanticScore = isNaN(similarity) ? 0 : similarity;
			} catch (error) {
				console.warn('Error calculating semantic similarity:', error);
				semanticScore = 0;
			}
		}

		// Validate and calculate provider score
		const providerScore =
			agent.llmProvider && requirement.preferred_llm_provider &&
				agent.llmProvider === requirement.preferred_llm_provider ? 1 : 0;

		// Validate and calculate skills overlap
		const agentSkills: string[] = agent?.skills || [];
		const skillsOverlap =
			requirement.skills && requirement.skills.length > 0 && agentSkills.length > 0
				? requirement.skills.filter((s) => agentSkills.includes(s)).length /
				requirement.skills.length
				: 0;

		// Validate and calculate cost score
		let costScore = 0;
		if (agent.agentCost && requirement.max_agent_cost) {
			const parsedCost = parseFloat(agent.agentCost);
			if (!isNaN(parsedCost)) {
				costScore = parsedCost <= requirement.max_agent_cost ? 1 : 0;
			}
		}

		// Calculate final score with validation
		const finalScore =
			1 * (isNaN(semanticScore) ? 0 : semanticScore) +
			0.2 * (isNaN(providerScore) ? 0 : providerScore) +
			0.2 * (isNaN(skillsOverlap) ? 0 : skillsOverlap) +
			0.1 * (isNaN(costScore) ? 0 : costScore);

		// Ensure final score is never NaN
		const validatedFinalScore = isNaN(finalScore) ? 0 : finalScore;

		// console.log('Agent scoring:', {
		// 	agentId: agent.id,
		// 	semanticScore,
		// 	providerScore,
		// 	skillsOverlap,
		// 	costScore,
		// 	finalScore: validatedFinalScore
		// });

		return { agent, finalScore: validatedFinalScore };
	});

	scoredAgents.sort((a, b) => b.finalScore - a.finalScore);
	// console.log('scoring', scoredAgents.sort((a, b) => b.finalScore - a.finalScore))

	return scoredAgents.slice(0, topN).map((a) => a.agent);
}
