import { Events, GuildMember, GuildPremiumTier, ThreadChannel } from "discord.js";
import SupportRoles from "../commands/user/SupportRoles";
import Client from "../structures/overwrite/Client";
import Embed from "../structures/overwrite/EmbedBuilder";
import { BaseEvent, SupportRole } from "../structures/Types";
import { main_guild, role_event_exsupporter, role_support_b0, role_support_b1, role_support_b2, role_support_b3, role_support_boosty, role_support_nitro } from "../utils/IDs";

const event: BaseEvent = {
    name: Events.GuildMemberUpdate,
    once: false,
    async execute(client: Client, oldMember: GuildMember, newMember: GuildMember) {
        if (newMember.guild.id != main_guild || newMember.user.bot) return;
        
        // Welcome Card
        if (oldMember.pending && !newMember.pending) {
            let logmessage = "Пользователь зашел на сервер (pending).";
            let dbUser = await client.lvls.get(newMember.id);
            if (dbUser.roles.length != 0) {
                let r = await newMember.roles.add(dbUser.roles).catch(() => {});
                if (r) logmessage += "\n" + "Выданы роли: " + dbUser.roles.map((r) => `<@&${r}>`).join(", ");
            }
            
            let db_channel = await client.db.get<string>("about_thread_joined");
            if (!db_channel) return client.logger.error(`[EVENTS|${this.name.toUpperCase()}|${newMember.id}]`, new Error(`Канал about_thread_joined <#${db_channel}> (${db_channel}) не найден.`));
            
            const channel = await client.channels.fetch(db_channel).catch(() => {});
            if (!channel) return client.logger.error(`[EVENTS|${this.name.toUpperCase()}|${newMember.id}]`, new Error(`Канал about_thread_joined <#${db_channel}> (${db_channel}) не найден на сервере.`));
            if (!(channel instanceof ThreadChannel)) return client.logger.error(`[EVENTS|${this.name.toUpperCase()}|${newMember.id}]`, new Error(`Канал about_thread_joined <#${db_channel}> (${db_channel}) найден на сервере, но не является тредом.`));

            if (channel.archived) await channel.setArchived(false);
            let reply = await client.lvls.getWelcomeCard(newMember.id);
            if (reply) {
                const message = await channel.send(reply).catch(() => {});
                if (message) client.db.set<string>(`welcome_${newMember.id}`, message.id);
            }
            client.logger.send(`[EVENTS|${this.name.toUpperCase()}|${newMember.id}] ${logmessage}`);
        }

        // Boosts Nitro
        if (!oldMember.roles.cache.has(role_support_nitro) && newMember.roles.cache.has(role_support_nitro)) {
            client.logger.send(`[EVENTS|${this.name.toUpperCase()}|${newMember.id}] Получение Nitro роли.`);
            
            let db_channel = await client.db.get<string>("about_thread_news");
            if (!db_channel) return client.logger.error(`[EVENTS|${this.name.toUpperCase()}|${newMember.id}]`, new Error(`Канал about_thread_news <#${db_channel}> (${db_channel}) не найден.`));
            
            const channel = await client.channels.fetch(db_channel).catch(() => {});
            if (!channel) return client.logger.error(`[EVENTS|${this.name.toUpperCase()}|${newMember.id}]`, new Error(`Канал about_thread_news <#${db_channel}> (${db_channel}) не найден на сервере.`));
            if (!(channel instanceof ThreadChannel)) return client.logger.error(`[EVENTS|${this.name.toUpperCase()}|${newMember.id}]`, new Error(`Канал about_thread_news <#${db_channel}> (${db_channel}) найден на сервере, но не является тредом.`));

            if (channel.archived) await channel.setArchived(false);

            channel.send({
                content: `<@${newMember.id}>, спасибо!`,
                embeds: [
                    new Embed()
                        .setColor('#E91E63')
                        .setThumbnail('http://iamnotacoder.ru/stickers/like.gif')
                        .setDescription(`<@${newMember.id}> забустил сервер!` + "\n" + `${newMember.guild.premiumTier != GuildPremiumTier.None ? `Тир ${newMember.guild.premiumTier}` : 'Нет'}`)
                ]
            });
        }

        // Boosty.to
        if (!oldMember.roles.cache.has(role_support_boosty) && newMember.roles.cache.has(role_support_boosty)) {
            client.logger.send(`[EVENTS|${this.name.toUpperCase()}|${newMember.id}] Получение Boosty роли.`);

            let db_channel = await client.db.get<string>("about_thread_news");
            if (!db_channel) return client.logger.error(`[EVENTS|${this.name.toUpperCase()}|${newMember.id}]`, new Error(`Канал about_thread_news <#${db_channel}> (${db_channel}) не найден.`));
            
            const channel = await client.channels.fetch(db_channel).catch(() => {});
            if (!channel) return client.logger.error(`[EVENTS|${this.name.toUpperCase()}|${newMember.id}]`, new Error(`Канал about_thread_news <#${db_channel}> (${db_channel}) не найден на сервере.`));
            if (!(channel instanceof ThreadChannel)) return client.logger.error(`[EVENTS|${this.name.toUpperCase()}|${newMember.id}]`, new Error(`Канал about_thread_news <#${db_channel}> (${db_channel}) найден на сервере, но не является тредом.`));

            if (channel.archived) await channel.setArchived(false);

            channel.send({
                content: `<@${newMember.id}>, спасибо!`,
                embeds: [
                    new Embed()
                        .setColor('#F1C40F')
                        .setThumbnail('http://iamnotacoder.ru/stickers/like.gif')
                        .setDescription(`<@${newMember.id}> забустил проект на Boosty!`)
                ]
            });
        }

        // Boosty levels
        let newMemberHasBoostyRole = newMember.roles.cache.some(r => [role_support_b0, role_support_b1, role_support_b2, role_support_b3].includes(r.id));
        let oldMemberHasBoostyRole = oldMember.roles.cache.some(r => [role_support_b0, role_support_b1, role_support_b2, role_support_b3].includes(r.id));
        if (newMemberHasBoostyRole) {
            newMember.roles.add(role_support_boosty).catch((error: Error) => client.logger.error(`[EVENTS|${this.name.toUpperCase()}|${newMember.id}] Ошибка выдачи роли role_support_boosty`, error));
        } else if (oldMemberHasBoostyRole && !newMemberHasBoostyRole) {
            newMember.roles.remove(role_support_boosty).catch((error: Error) => client.logger.error(`[EVENTS|${this.name.toUpperCase()}|${newMember.id}] Ошибка снятия роли role_support_boosty`, error));
            newMember.roles.add(role_event_exsupporter).catch((error: Error) => client.logger.error(`[EVENTS|${this.name.toUpperCase()}|${newMember.id}] Ошибка выдачи роли role_event_exsupporter`, error));
        }

        // Support Roles
        if (oldMember.roles.cache.some(r => [role_support_boosty, role_support_nitro].includes(r.id)) && !newMember.roles.cache.some(r => [role_support_boosty, role_support_nitro].includes(r.id))) {
            let role_data = await client.db.get<SupportRole>(`support_roles.u_${newMember.id}`);
            if (role_data && role_data.id) {
                let command = client.commands.get('role');
                if (command instanceof SupportRoles) command.deleteRole(client, newMember);
            }
        }

        // Support Roles Hoist
        if (oldMember.roles.cache.some(r => [ role_support_b2, role_support_b3 ].includes(r.id)) && !newMember.roles.cache.some(r => [ role_support_b2, role_support_b3 ].includes(r.id))) {
            let role_data = await client.db.get(`support_roles.u_${newMember.id}`);
            if (role_data) {
                await client.db.set(`support_roles.u_${newMember.id}.hoist`, false);
                let command = client.commands.get('role');
                if (command instanceof SupportRoles) command.setRoleHoist(client, newMember);
            }
        }
    }
}

export default event;