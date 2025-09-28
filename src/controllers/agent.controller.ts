import { Context } from "hono"
import { getCookie } from "hono/cookie"
import { AgentService } from "../services/agent.service"

export class AgentController {
    public static readonly primary = async (c: Context) => {
        const { requirement_json, message } = await c.req.json()
        const agentId = getCookie(c, 'agent_id')
        const agentResponse = await AgentService.primary(c, requirement_json, agentId, message)
        return c.json(agentResponse)
    }

    public static readonly createAgent = async (c: Context) => {
        const { name, description, agentCost, deployedUrl, llmProvider, skills, is_multiAgentSystem, default_agent_name, framework_used, can_stream } = await c.req.json()
        const user = await c.get('user')

        if (!user) {
            return c.json({ error: "User not authenticated" }, 401)
        }

        const agent = await AgentService.createAgent(user.id, { name, description, agentCost, deployedUrl, llmProvider, skills, is_multiAgentSystem, default_agent_name, framework_used, can_stream })
        return c.json(agent)
    }
}