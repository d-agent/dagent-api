import { Data } from "lucid-cardano";

// Agent type schema
export const AgentSchema = Data.Object({
	agent_address: Data.Bytes(),
	provider: Data.Bytes(),
	agent_id_hash: Data.Bytes(),
	owner: Data.Bytes(),
	is_active: Data.Boolean(),
	created_at: Data.Integer(),
	updated_at: Data.Integer(),
	metadata_uri: Data.Bytes(),
});
export type Agent = Data.Static<typeof AgentSchema>;

// Contract datum schema - stores all agents
export const AgentDatumSchema = Data.Object({
	contract_owner: Data.Bytes(),
	agents: Data.Array(AgentSchema),
});
export type AgentDatum = Data.Static<typeof AgentDatumSchema>;

// Redeemer actions schema
export const AgentRedeemerSchema = Data.Enum([
	Data.Object({
		RegisterAgent: Data.Object({
			agent_address: Data.Bytes(),
			agent_id_hash: Data.Bytes(),
			owner: Data.Bytes(),
			metadata_uri: Data.Bytes(),
		}),
	}),
	Data.Object({
		UpdateAgent: Data.Object({
			agent_address: Data.Bytes(),
			is_active: Data.Boolean(),
			metadata_uri: Data.Bytes(),
		}),
	}),
	Data.Object({
		GetAgent: Data.Object({
			agent_address: Data.Bytes(),
		}),
	}),
]);

export type AgentRedeemer = Data.Static<typeof AgentRedeemerSchema>;
