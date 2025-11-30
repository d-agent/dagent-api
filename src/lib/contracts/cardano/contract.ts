import { Blockfrost, Lucid } from "lucid-cardano";

enum Network {
	Mainnet = "Mainnet",
	Preview = "Preview",
	Preprod = "Preprod",
}

enum NetworkURI {
	Mainnet = "https://cardano-mainnet.blockfrost.io/api/v0",
	Preview = "https://cardano-preview.blockfrost.io/api/v0",
	Preprod = "https://cardano-preprod.blockfrost.io/api/v0",
}

export class CardanoContractClient {
	private network: Network.Preview;
	private cardanoNodeUrl = NetworkURI[Network.Preview];
	public lucid!: Lucid;
	public blockfrost!: Blockfrost;

	constructor(private config: { projectId: string }) {
		this.network = Network.Preview;
	}

	async initialize() {
		if (!this.lucid) {
			this.blockfrost = new Blockfrost(
				this.cardanoNodeUrl,
				this.config.projectId
			);
			this.lucid = await Lucid.new(this.blockfrost, this.network);
		}
	}
}
