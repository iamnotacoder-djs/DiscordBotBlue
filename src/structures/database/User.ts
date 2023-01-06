import { model, Schema } from "mongoose";

export interface IUser {
	id: string,
	lvl: number,
	lvl_date: number,
	exp: number,
	profile_type: number,
	// счетчики
	messages: number,
	voiceminutes: number,
	reactions: number,
	emojis: number,
	pictures: number,
	stickers: number,
	// прочее
	invited_bot: string,
	roles: string[],
	joinedAt: number,
	github: string,
	boosty: string
}

const UserSchema = new Schema<IUser>({
	id: { type: String, default: null },
	lvl: { type: Number, default: 1 },
	lvl_date: { type: Number, default: Date.now() },
	exp: { type: Number, default: 0 },
	profile_type: { type: Number, default: 0 },
	// счетчики
	messages: { type: Number, default: 0 },
	voiceminutes: { type: Number, default: 0 },
	reactions: { type: Number, default: 0 },
	emojis: { type: Number, default: 0 },
	pictures: { type: Number, default: 0 },
	stickers: { type: Number, default: 0 },
	// прочее
	invited_bot: { type: String, default: null },
	roles: { type: [ String ], default: [] },
	joinedAt: { type: Number, default: Date.now() },
	github: { type: String, default: null },
	boosty: { type: String, default: null }
});

export const MUser = model<IUser>("User", UserSchema);