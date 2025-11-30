import { Data } from "lucid-cardano";

export const StakeSchema = Data.Object({
	client: Data.Bytes(),
	provider: Data.Bytes(),
	amount: Data.Integer(),
	user_id: Data.Bytes(),
});
export type Stake = Data.Static<typeof StakeSchema>;

export const StakeDatumSchema = Data.Object({
	stakes: Data.Array(StakeSchema),
	total_stake: Data.Integer(),
	total_count: Data.Integer(),
});
export type StakeDatum = Data.Static<typeof StakeDatumSchema>;

export const StakeActionsSchema = Data.Enum([
	Data.Object({
		CreateStake: Data.Object({
			client: Data.Bytes(),
			provider: Data.Bytes(),
			amount: Data.Integer(),
			user_id: Data.Bytes(),
		}),
	}),
	Data.Object({
		TransferStake: Data.Object({
			from_user_id: Data.Bytes(),
			to_user_id: Data.Bytes(),
			amount: Data.Integer(),
		}),
	}),
	Data.Object({
		PullStake: Data.Object({
			user_id: Data.Bytes(),
			amount: Data.Integer(),
		}),
	}),
	Data.Object({
		GetAddressStake: Data.Object({
			address: Data.Bytes(),
		}),
	}),
	Data.Object({
		PullAllStake: Data.Object({
			user_id: Data.Bytes(),
		}),
	}),
	Data.Object({ GetTotalStake: Data.Object({}) }),
	Data.Object({ GetTotalStakeCount: Data.Object({}) }),
]);

export type StakeActions = Data.Static<typeof StakeActionsSchema>;