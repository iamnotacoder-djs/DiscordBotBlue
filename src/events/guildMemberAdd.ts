import { Events, GuildMember, TextChannel, ThreadChannel } from "discord.js";
import Client from "../structures/overwrite/Client";
import Embed from "../structures/overwrite/EmbedBuilder";
import { BaseEvent, BotOwnerData, BotOwnerRequest } from "../structures/Types";
import { channel_botowners_gallery, main_guild, role_botowner_bot, role_botowner_user } from "../utils/IDs";

const event: BaseEvent = {
    name: Events.GuildMemberAdd,
    once: false,
    async execute(client: Client, member: GuildMember) {
        if (member.guild.id != main_guild) return;

        client.logger.send(`[EVENTS|${this.name.toUpperCase()}|${member.id}] Пользователь зашел на сервер.`);
        if (!member.user.bot) return;

        let bot_data = await client.db.get<BotOwnerRequest>(`botowner_b${member.id}`);
        if (!bot_data) return;

        // Роль для бота
        member.roles.add(role_botowner_bot).catch(() => {});
                
        // Очистка админ-сообщения
        if (bot_data.admin_msg) {
            const channel_id = await client.db.get<string>("mods_thread_botowners").catch(() => {});
            if (channel_id) {
                const channel = await client.channels.fetch(channel_id).catch(() => {});
                if (channel instanceof ThreadChannel && bot_data.admin_msg) {
                    if (channel.archived) await channel.setArchived(false);

                    const message = await channel.messages.fetch(bot_data.admin_msg).catch(() => {});
                    if (message) {
                        message.delete().catch(() => {});
                        bot_data.admin_msg = undefined;
                    }
                }
            }
        }

        // Выдача роли владельцу
        const owner = await member.guild.members.fetch(bot_data.owner_id).catch(() => {});
        if (owner) owner.roles.add(role_botowner_user).catch(() => {});

        // БД
        const dbBotsArray = await client.db.get<BotOwnerData[]>("botowner_bots") ?? [];
        let found = false;
        for (let db of dbBotsArray) {
            if (db.client_id == member.id) found = true;
        }
        if (!found) client.db.push<BotOwnerData>("botowner_bots", {
            client_id: member.id,
            owner_id: bot_data.owner_id
        });
                
        // Оповещение
        const channel = await client.channels.fetch(channel_botowners_gallery).catch(() => {});
        if (channel instanceof TextChannel) {
            const message = await channel.send({
                content: `<@${bot_data.owner_id}>`,
                embeds: [
                    new Embed()
                        .setAuthor({
                            name: bot_data.name, 
                            iconURL: member.displayAvatarURL(),
                            url: `https://discordapp.com/users/${member.id}/`
                        })
                        .setDescription(`${bot_data.description}\n\n\`${bot_data.command}\`\n\n<@${member.id}>`)
                ]
            }).catch(() => {});
            if (message) bot_data.public_msg = message.id;
        }

        // БД
        await client.db.set<BotOwnerRequest>(`botowner_b${member.id}`, bot_data);
    }
}

export default event;