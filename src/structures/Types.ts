import { HexColorString } from "discord.js";

export interface BaseEvent {
    readonly name: string;
    readonly once: boolean;
    readonly execute: Function;
}

export interface SupportRoleMenu {
    message: string,
    channel: string
}

export interface SupportRole {
    color: HexColorString,
    name: string,
    emojiURL: string,
    hoist: false,
    id: string | null
}

export interface ModelUser {
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
    archieve: ModelArchieve[],
	invited_bot: string,
	roles: string[],
	joinedAt: number
}

export interface ModelArchieve {
    lvl: number,
    exp: number,
    messages: number,
    voiceminutes: number,
    reactions: number,
    emojis: number,
    pictures: number,
    stickers: number,

    _messages: number,
    _voiceminutes: number,
    _reactions: number,
    _emojis: number,
    _pictures: number,
    _stickers: number
}

export type LevelSystemAddOptions = { 
    messages?: number, 
    voiceminutes?: number, 
    reactions?: number, 
    emojis?: number, 
    pictures?: number, 
    stickers?: number, 
    exp?: number 
}

export type LevelSystemSetOptions = {
    lvl?: number,
    messages?: number, 
    voiceminutes?: number, 
    reactions?: number, 
    emojis?: number, 
    pictures?: number, 
    stickers?: number, 
    github?: string, 
    boosty?: string, 
    roles?: string[], 
    invited_bot?: string, 
    profile_type?: number
}

export type LoggerBotInfo = {
    username: string,
    avatarURL: string
}

export type HabrPost = {
    content: string,
    id: number,
    title: string,
    contentSnippet: string,
    date: number
}

export type SelfSacrificeStats = {
    toxics: number,
    kicks: number,
    timouts: number,
    members: string[]
}

export type BotOwnerRequest = {
    client_id: string,
    name: string,
    description: string,
    command: string,
    admin_msg?: string,
    public_msg?: string,
    owner_id: string
}

export type BotOwnerData = {
    client_id: string,
    owner_id: string
}

export type PollData = {
    question: string,
    answers: PollAnswer[],
    image?: string,
    members: string[],
    startDate: number,
    endDate: number
}

export type PollAnswer = {
    index: number,
    answer: string,
    votes: number
}