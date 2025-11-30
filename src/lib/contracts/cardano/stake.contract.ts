import { CardanoContractClient } from "./contract";
import StakePlutusAbi from "./abis/plutus.json";
import { config } from "../../env";
import { Data, Script, UTxO } from "lucid-cardano";
import {
	StakeActions,
	StakeDatum,
	StakeDatumSchema,
} from "./schema/stake-contract.types";

class StakeContractClient extends CardanoContractClient {
	public static instance: StakeContractClient;
	private walletAddress: string;
	private stakeValidator: Script;
	private stakeAddress!: string;

	constructor() {
		super({ projectId: config.BLACKFROST_PROJECT_ID });

		this.walletAddress = config.WALLET_PRIVATE_KEY;

		this.stakeValidator = {
			type: "PlutusV2",
			script: StakePlutusAbi.validators[2].compiledCode,
		};
	}

	async initialize() {
		await super.initialize();

		this.lucid.selectWalletFromPrivateKey(this.walletAddress);

		this.stakeAddress = this.lucid.utils.validatorToAddress(
			this.stakeValidator
		);
	}

	public static async getInstance(): Promise<StakeContractClient> {
		if (!StakeContractClient.instance) {
			StakeContractClient.instance = new StakeContractClient();
		}
		return StakeContractClient.instance;
	}

	private async fetchStakeUtxo(): Promise<UTxO[]> {
		const utxos = await this.lucid.utxosAt(this.stakeAddress);

		if (!utxos || utxos.length === 0)
			throw new Error(
				"No contract UTxOs found. Contract not deployed / no state."
			);

		return utxos;
	}

	async transferStake({
		to,
		from,
		amount,
	}: {
		to: string;
		from: string;
		amount: string;
	}) {
		// Fetch UTXOs fresh
		const stakeUtxo = await this.fetchStakeUtxo();
		const utxo = stakeUtxo[0];

		if (!utxo.datum) {
			throw new Error("Stake UTxO datum is missing");
		}

		// Decode datum based on schema
		const currentDatum = Data.from(utxo.datum, StakeDatumSchema) as unknown as StakeDatum;

		// Apply state transition (client-side simulation)
		const newDatum = this._applyTransferStake(currentDatum, {
			from_user_id: from,
			to_user_id: to,
			amount: BigInt(amount),
		});

		const datumPlutus = Data.to(newDatum as any);

		const redeemer: StakeActions = {
			TransferStake: {
				from_user_id: from,
				to_user_id: to,
				amount: BigInt(amount),
			},
		};

		const redeemerPlutus = Data.to(redeemer as any);

		// Build TX
		const tx = await this.lucid
			.newTx()
			.collectFrom([utxo], redeemerPlutus)
			.attachSpendingValidator(this.stakeValidator)
			.payToContract(
				this.stakeAddress,
				{ inline: datumPlutus },
				{ lovelace: utxo.assets.lovelace }
			)
			.complete();

		// Sign + submit
		const signed = await tx.sign().complete();
		const txHash = await signed.submit();
		return txHash;
	}

	private _applyTransferStake(
		datum: StakeDatum,
		args: { from_user_id: string; to_user_id: string; amount: bigint }
	): StakeDatum {
		const { from_user_id, to_user_id, amount } = args;

		if (amount <= BigInt(0)) {
			throw new Error("Amount must be > 0");
		}

		const stakes = [...datum.stakes];

		const fromIndex = stakes.findIndex((s) => s.user_id === from_user_id);
		if (fromIndex === -1) {
			throw new Error("from_user_id not found in stakes");
		}

		const fromStake = stakes[fromIndex];

		if (fromStake.amount < amount) {
			throw new Error("Insufficient stake to transfer");
		}

		const updatedFrom = {
			...fromStake,
			amount: fromStake.amount - amount,
		};

		if (updatedFrom.amount === BigInt(0)) {
			stakes.splice(fromIndex, 1);
		} else {
			stakes[fromIndex] = updatedFrom;
		}

		const toIndex = stakes.findIndex((s) => s.user_id === to_user_id);

		if (toIndex === -1) {
			stakes.push({
				client: fromStake.client,
				provider: fromStake.provider,
				amount,
				user_id: to_user_id,
			});
		} else {
			stakes[toIndex] = {
				...stakes[toIndex],
				amount: stakes[toIndex].amount + amount,
			};
		}

		const total_stake = datum.total_stake;
		const total_count = BigInt(stakes.length);

		return { stakes, total_stake, total_count };
	}
}

export const stakeContract = StakeContractClient.getInstance();
