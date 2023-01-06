import { Events, GuildMember, TextChannel, ThreadChannel } from "discord.js";
import SupportRoles from "../commands/user/SupportRoles";
import Client from "../structures/overwrite/Client";
import { BaseEvent, BotOwnerData, BotOwnerRequest, SupportRole } from "../structures/Types";
import { channel_botowners_gallery, main_guild } from "../utils/IDs";

const event: BaseEvent = {
    name: Events.GuildMemberRemove,
    once: false,
    async execute(client: Client, member: GuildMember) {
        if (member.guild.id != main_guild) return;

        client.logger.send(`[EVENTS|${this.name.toUpperCase()}|${member.id}] Пользователь вышел с сервера.`);
        if (member.user.bot) {
            await client.db.set<BotOwnerData>("botowner_bots", (await client.db.get<BotOwnerData[]>("botowner_bots") ?? []).filter((data) => data.client_id != member.id));

            // Оповещение
            let bot_data = await client.db.get<BotOwnerRequest>(`botowner_b${member.id}`);
            if (bot_data && bot_data.public_msg) {
                const channel = await client.channels.fetch(channel_botowners_gallery).catch(() => {});
                if (channel instanceof TextChannel) {
                    const message = await channel.messages.fetch(bot_data.public_msg).catch(() => {});
                    if (message) message.delete().catch(() => {});
                }
            }

            // БД
            await client.db.delete(`botowner_b${member.id}`);
        } else {
            // Welcome card
            const message_id = await client.db.get<string>(`welcome_${member.id}`);
            if (message_id) {
                
                let db_channel = await client.db.get<string>("about_thread_joined");
                if (!db_channel) return client.logger.error(`[EVENTS|${this.name.toUpperCase()}|${member.id}]`, new Error(`Канал about_thread_joined <#${db_channel}> (${db_channel}) не найден.`));
                
                const channel = await client.channels.fetch(db_channel).catch(() => {});
                if (!channel) return client.logger.error(`[EVENTS|${this.name.toUpperCase()}|${member.id}]`, new Error(`Канал about_thread_joined <#${db_channel}> (${db_channel}) не найден на сервере.`));
                if (!(channel instanceof ThreadChannel)) return client.logger.error(`[EVENTS|${this.name.toUpperCase()}|${member.id}]`, new Error(`Канал about_thread_joined <#${db_channel}> (${db_channel}) найден на сервере, но не является тредом.`));

                if (channel.archived) await channel.setArchived(false);

                const message = await channel.messages.fetch(message_id).catch(() => {});
                if (message) {
                    message.delete();
                    client.db.delete(`welcome_${member.id}`);
                }

            }

            // Support Roles
            let role_data = await client.db.get<SupportRole>(`support_roles.u_${member.id}`);
            if (role_data && role_data.id) {
                let command = client.commands.get('role');
                if (command instanceof SupportRoles) command.deleteRole(client, member);
            }
        }
    }
}

export default event;