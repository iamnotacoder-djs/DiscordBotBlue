import { Events, VoiceState } from "discord.js";
import Client from "../structures/overwrite/Client";
import { BaseEvent } from "../structures/Types";

const event: BaseEvent = {
    name: Events.VoiceStateUpdate,
    once: false,
    async execute(client: Client, oldState: VoiceState, newState: VoiceState) {
        if (!newState.member || newState.member.user.bot) return;

        if (!oldState.channelId && newState.channelId && !newState.mute) {

            // Зашел в голосовой чат
            // Старый канал - не найден
            // Новый канал - найден
            // Мут - выключен
            client.db.set<number>(`lvlsystem_voiceminutes.${newState.member.id}`, Date.now());

        } else if (oldState.channelId && !newState.channelId && !newState.mute) {

            // Вышел из голосового чата
            // Старый канал - найден
            // Новый канал - не найден
            // Мут - выключен
            let enter = await client.db.get<number>(`lvlsystem_voiceminutes.${newState.member.id}`) ?? -1;
            if (enter == -1) return;
            let time = Math.round(((Date.now() - enter)/1000/60));
            if (time != 0) {
                client.lvls.add(newState.member.id, { voiceminutes: time });
            }
            await client.db.set<number>(`lvlsystem_voiceminutes.${newState.member.id}`, -1);

        } else if (oldState.channelId && newState.channelId && newState.mute) {

            // Находится в голосовом чате
            // Старый канал - найден
            // Новый канал - найден
            // Мут - включен
            let enter = await client.db.get<number>(`lvlsystem_voiceminutes.${newState.member.id}`) ?? -1;
            if (enter == -1) return;
            let time = Math.round(((Date.now() - enter)/1000/60));
            if (time != 0) {
                client.lvls.add(newState.member.id, { voiceminutes: time });
            }
            await client.db.set<number>(`lvlsystem_voiceminutes.${newState.member.id}`, -1);

        } else if (oldState.channelId && newState.channelId && !newState.mute) {

            // Находится в голосовом чате
            // Старый канал - найден
            // Новый канал - найден
            // Мут - выключен
            client.db.set<number>(`lvlsystem_voiceminutes.${newState.member.id}`, Date.now());

        }
    }
}

export default event;
