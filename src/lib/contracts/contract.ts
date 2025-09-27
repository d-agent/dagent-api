import { Contract, JsonRpcProvider, Wallet } from "ethers";

export class ContractClient {
	private provider: JsonRpcProvider;
	protected wallet: Wallet;
	protected constructor(
		private config: { rpc: string; contractPrivateKey: string }
	) {
		this.provider = new JsonRpcProvider(config.rpc);
		this.wallet = new Wallet(config.contractPrivateKey, this.provider);
	}
}
