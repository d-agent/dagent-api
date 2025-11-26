import axios from "axios";
import {
	ICreateSessionParams,
	IResponseCreateSession,
	IResponseListApps,
} from "../../../types/agents";

class AgentApi {
	private static instance: AgentApi;
	private constructor() {}

	public static getInstance(): AgentApi {
		if (!AgentApi.instance) {
			AgentApi.instance = new AgentApi();
		}
		return AgentApi.instance;
	}

	public async getApp(agent_url: string): Promise<IResponseListApps> {
		const { data } = await axios.get(`${agent_url}/list-apps`);
		return data;
	}

	public async createSession(
		params: ICreateSessionParams
	): Promise<IResponseCreateSession> {
		const { userId, sessionId, app_name, uri } = params;
		const { data } = await axios.post(
			`${uri}/apps/${app_name}/users/${userId.toString()}/sessions/${sessionId}`,
			{
				userId,
			}
		);
		return data;
	}
}

export const agentApi = AgentApi.getInstance();
