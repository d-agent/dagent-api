// stake contract ts
export interface Escrow {
	client: string;
	provider: string;
	userId: string;
	amount: bigint;
}

export interface StakeContractConfig {
	rpc: string;
	contractPrivateKey: string;
	abi: any;
	contractAddress: string;
}

export interface Agent {
	agentAddress: string;
	provider: string;
	agentIdHash: string;
	owner: string;
	isActive: boolean;
	createdAt: bigint;
	updatedAt: bigint;
	metadataUri: string;
}
