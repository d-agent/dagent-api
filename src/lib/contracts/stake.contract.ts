import { Contract, parseEther } from "ethers";
import { ContractClient } from "./contract";
import stakeAbi from "./abis/stake-abis.json";
import { Escrow } from "../../types/contract";
import { weiToEth } from "../utils/helper";

class StakeContractClient extends ContractClient {
	private contract: Contract;
	private static _instance: StakeContractClient;
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

	public static instance({
		rpc,
		contractPrivateKey,
		abi,
		contractAddress,
	}: {
		rpc: string;
		contractPrivateKey: string;
		abi: any;
		contractAddress: string;
	}) {
		if (!StakeContractClient._instance) {
			StakeContractClient._instance = new StakeContractClient({
				rpc,
				contractPrivateKey,
				abi,
				contractAddress,
			});
		}
		return StakeContractClient._instance;
	}

	async getAddressStake(address: string): Promise<Escrow> {
		console.log("address: ", address);
		try {
			const data = await this.contract.getAddressStake(address);
			return {
				client: data.client,
				provider: data.provider,
				userId: data.userId,
				amount: data.amount,
			};
		} catch (error) {
			throw new Error(
				`Failed to get address stake: ${
					error instanceof Error ? error.message : "Unknown error"
				}`
			);
		}
	}

	async totalEscrowAmount(): Promise<bigint> {
		const amt = await this.contract.totalEscrowAmount();
		return BigInt(amt.toString());
	}

	async totalEscrowCount(): Promise<number> {
		const count = await this.contract.totalEscrowCount();
		return Number(count.toString());
	}

	async transferEscrow({
		to,
		from,
		amount,
	}: {
		to: string;
		from: string;
		amount: string;
	}) {
		try {
			const tx = await this.contract.transferEscrow(
				to,
				from,
				parseEther(amount)
			);
			await tx.wait();
			return tx;
		} catch (error) {
			throw new Error(
				`Failed to transfer escrow: ${
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

export const stakeContract = StakeContractClient.instance({
	rpc: process.env.RPC_URL!,
	abi: stakeAbi.abi,
	contractAddress: process.env.STAKE_CONTRACT_ADDRESS!,
	contractPrivateKey: process.env.CONTRACT_PRIVATE_KEY!,
});
