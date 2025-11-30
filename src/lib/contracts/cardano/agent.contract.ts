import { CardanoContractClient } from "./contract";
import AgentPlutusAbi from "./abis/plutus.json";
import { config } from "../../env";
import { Data, Script, UTxO } from "lucid-cardano";
import {
	Agent,
	AgentDatum,
	AgentDatumSchema,
	AgentRedeemer,
} from "./schema/agent-contract.types";

class AgentContractClient extends CardanoContractClient {
	public static instance: AgentContractClient;
	private walletAddress: string;
	private agentUtxo!: UTxO[];
	private agentValidator: Script;
	private agentAddress!: string;

	constructor() {
		super({ projectId: config.BLACKFROST_PROJECT_ID });
		this.walletAddress = config.WALLET_PRIVATE_KEY;
		this.agentValidator = {
			type: "PlutusV2",
			script: AgentPlutusAbi.validators[0].compiledCode,
		};
	}

	async initialize() {
		await super.initialize();
		this.lucid.selectWalletFromPrivateKey(this.walletAddress);
		this.agentAddress = this.lucid.utils.validatorToAddress(
			this.agentValidator
		);
		this.agentUtxo = await this.lucid.utxosAt(this.agentAddress);
	}

	public static async getInstance(): Promise<AgentContractClient> {
		if (!AgentContractClient.instance) {
			AgentContractClient.instance = new AgentContractClient();
			await AgentContractClient.instance.initialize();
		}
		return AgentContractClient.instance;
	}

	private async fetchAgentUtxo(): Promise<UTxO[]> {
		const utxos = await this.lucid.utxosAt(this.agentAddress);

		if (!utxos || utxos.length === 0)
			throw new Error(
				"No contract UTxOs found. Contract not deployed / no state."
			);

		return utxos;
	}

	async registerAgent({
		agentAddress,
		provider,
		agentIdHash,
		owner,
		metadataUri,
	}: {
		agentAddress: string;
		provider: string;
		agentIdHash: string;
		owner: string;
		metadataUri: string;
	}): Promise<string> {
		const agentUtxo = await this.fetchAgentUtxo();

		if (!agentUtxo[0]?.datum) {
			throw new Error("Agent UTxO datum is missing");
		}

		const currentDatum = Data.from(
			agentUtxo[0].datum,
			AgentDatumSchema
		) as unknown as AgentDatum;

		const timestamp = BigInt(Date.now());
		const newAgent: Agent = {
			agent_address: agentAddress,
			provider: provider,
			agent_id_hash: agentIdHash,
			owner: owner,
			is_active: true,
			created_at: timestamp,
			updated_at: timestamp,
			metadata_uri: metadataUri,
		};

		const newDatum: AgentDatum = {
			contract_owner: currentDatum.contract_owner,
			agents: [...currentDatum.agents, newAgent],
		};

		const datumPlutus = Data.to(newDatum as any);

		const redeemer: AgentRedeemer = {
			RegisterAgent: {
				agent_address: agentAddress,
				agent_id_hash: agentIdHash,
				owner: owner,
				metadata_uri: metadataUri,
			},
		};

		const redeemerPlutus = Data.to(redeemer as any);

		const tx = await this.lucid
			.newTx()
			.collectFrom(this.agentUtxo, redeemerPlutus)
			.attachSpendingValidator(this.agentValidator)
			.payToContract(
				this.agentAddress,
				{ inline: datumPlutus },
				{
					lovelace: this.agentUtxo[0].assets.lovelace,
				}
			)
			.complete();

		if (!tx) {
			throw new Error("Transaction creation failed");
		}

		const signed = await tx.sign().complete();
		const txHash = await signed.submit();

		return txHash;
	}

	async updateAgent({
		agentAddress,
		isActive,
		metadataUri,
	}: {
		agentAddress: string;
		isActive: boolean;
		metadataUri: string;
	}): Promise<string> {
		const agentUtxo = await this.fetchAgentUtxo();
		const utxo = agentUtxo[0];

		if (!utxo.datum) {
			throw new Error("Agent UTxO datum is missing");
		}

		const currentDatum = Data.from(
			utxo.datum,
			AgentDatumSchema
		) as unknown as AgentDatum;

		const agentIndex = currentDatum.agents.findIndex(
			(a) => a.agent_address === agentAddress
		);

		if (agentIndex === -1) {
			throw new Error(`Agent with address ${agentAddress} not found`);
		}

		const updatedAgents = [...currentDatum.agents];
		updatedAgents[agentIndex] = {
			...updatedAgents[agentIndex],
			is_active: isActive,
			metadata_uri: metadataUri,
			updated_at: BigInt(Date.now()),
		};

		const newDatum: AgentDatum = {
			contract_owner: currentDatum.contract_owner,
			agents: updatedAgents,
		};

		const datumPlutus = Data.to(newDatum as any);

		const redeemer: AgentRedeemer = {
			UpdateAgent: {
				agent_address: agentAddress,
				is_active: isActive,
				metadata_uri: metadataUri,
			},
		};

		const redeemerPlutus = Data.to(redeemer as any);

		const tx = await this.lucid
			.newTx()
			.collectFrom(this.agentUtxo, redeemerPlutus)
			.attachSpendingValidator(this.agentValidator)
			.payToContract(
				this.agentAddress,
				{ inline: datumPlutus },
				{
					lovelace: this.agentUtxo[0].assets.lovelace,
				}
			)
			.complete();

		if (!tx) {
			throw new Error("Transaction creation failed");
		}

		const signed = await tx.sign().complete();
		const txHash = await signed.submit();

		return txHash;
	}

	async getAgent(agentAddress: string): Promise<Agent | null> {
		const agentUtxo = await this.fetchAgentUtxo();
		if (!agentUtxo[0]?.datum) {
			throw new Error("Agent UTxO datum is missing");
		}

		const currentDatum = Data.from(
			agentUtxo[0].datum,
			AgentDatumSchema
		) as unknown as AgentDatum;

		const agent = currentDatum.agents.find(
			(a) => a.agent_address === agentAddress
		);

		return agent || null;
	}

	async getAllAgents(): Promise<Agent[]> {
		const agentUtxo = await this.fetchAgentUtxo();

		if (!agentUtxo[0]?.datum) {
			throw new Error("Agent UTxO datum is missing");
		}

		const currentDatum = Data.from(
			agentUtxo[0].datum,
			AgentDatumSchema
		) as unknown as AgentDatum;

		return currentDatum.agents;
	}

	async getAgentsByOwner(owner: string): Promise<Agent[]> {
		const allAgents = await this.getAllAgents();
		return allAgents.filter((agent) => agent.owner === owner);
	}

	async getActiveAgents(): Promise<Agent[]> {
		const allAgents = await this.getAllAgents();
		return allAgents.filter((agent) => agent.is_active);
	}

	async getAgentsByProvider(provider: string): Promise<Agent[]> {
		const allAgents = await this.getAllAgents();
		return allAgents.filter((agent) => agent.provider === provider);
	}
}

export const agentContract = AgentContractClient.getInstance();
