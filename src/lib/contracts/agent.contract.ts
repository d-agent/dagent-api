import { Contract } from "ethers";
import { ContractClient } from "./contract";
import agentAbi from "./abis/agent-abis.json";
import { Agent } from "../../types/contract";

class AgentContractClient extends ContractClient {
	private contract: Contract;
	private static _instance: AgentContractClient;
	private constructor(config: {
		rpc: string;
		contractPrivateKey: string;
		abi: any;
		contractAddress: string;
	}) {
		super({ contractPrivateKey: config.contractPrivateKey, rpc: config.rpc });
		this.contract = new Contract(
			config.contractAddress,
			config.abi,
			this.wallet
		);
	}

	public static instance(config: {
		rpc: string;
		contractPrivateKey: string;
		abi: any;
		contractAddress: string;
	}) {
		if (!AgentContractClient._instance) {
			AgentContractClient._instance = new AgentContractClient(config);
		}
		return AgentContractClient._instance;
	}

	public async registerAgent({
		agentAddress,
		agentIdHash,
		ownerId,
		metadataUri = "",
	}: {
		agentAddress: string;
		agentIdHash: string;
		ownerId: string;
		metadataUri?: string;
	}): Promise<string> {
		try {
			const tx = await this.contract.registerAgent(
				agentAddress,
				agentIdHash,
				ownerId,
				metadataUri
			);
			const receipt = await tx.wait();
			return receipt.transactionHash;
		} catch (error) {
			throw new Error(
				`Failed to register agent: ${
					error instanceof Error ? error.message : "Unknown error"
				}`
			);
		}
	}

	// ✅ Fixed function name (Solidity: getAgent)
	public async getAgent(agentAddress: string): Promise<Agent> {
		try {
			const agent = await this.contract.getAgent(agentAddress);

			return {
				agentAddress: agent.agentAddress,
				provider: agent.provider,
				agentIdHash: agent.agentIdHash,
				owner: agent.owner,
				isActive: agent.isActive,
				createdAt: BigInt(agent.createdAt.toString()),
				updatedAt: BigInt(agent.updatedAt.toString()),
				metadataUri: agent.metadataUri,
			};
		} catch (error) {
			throw new Error(
				`Failed to fetch agent: ${
					error instanceof Error ? error.message : "Unknown error"
				}`
			);
		}
	}

	public async isAgentActive(agentAddress: string): Promise<boolean> {
		try {
			return await this.contract.isAgentActive(agentAddress);
		} catch (error) {
			throw new Error(
				`Failed to check agent status: ${
					error instanceof Error ? error.message : "Unknown error"
				}`
			);
		}
	}
}

// Generate a valid private key for development if none is provided
const getValidPrivateKey = () => {
	const envKey = process.env.CONTRACT_PRIVATE_KEY;
	if (envKey) {
		return envKey;
	}

	// For development, generate a valid private key
	// This is a known valid private key for testing (DO NOT USE IN PRODUCTION)
	return "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
};

export const agentContract = AgentContractClient.instance({
	rpc: process.env.RPC_URL || "https://ethereum-goerli.publicnode.com",
	abi: agentAbi.abi,
	contractAddress:
		process.env.AGENT_CONTRACT_ADDRESS ||
		"0x0000000000000000000000000000000000000000",
	contractPrivateKey: getValidPrivateKey(),
});
