import { ApplicationCommandData, ApplicationCommandType, CacheType, ChatInputCommandInteraction, ForumChannel, OverwriteType, PermissionFlagsBits, SortOrderType, ThreadAutoArchiveDuration } from "discord.js";
import BaseCommand from "../../structures/handlers/BaseCommand";
import Client from "../../structures/overwrite/Client";
import { CommandType, deferReply, getChannel, _replyNullChannel, _replyNullGuild } from "../../utils/ConfigUtil";
import { channel_mods, main_guild, role_botowner_bot, role_server_admins, role_server_mods } from "../../utils/IDs";

export default class About extends BaseCommand {

    // Основные параметры
	name: string = "mods";
	usage: string = "Заполнить канал Модераторская";
    type: string[] = [ CommandType.SlashApplication ];
	slash: ApplicationCommandData = {
		name: this.name,
		description: this.usage,
		type: ApplicationCommandType.ChatInput,
		options: [],
		dmPermission: false,
		defaultMemberPermissions: PermissionFlagsBits.Administrator
	};
    requireClient: boolean = true;

	constructor() { super(); }

    async onChatInputCommand(interaction: ChatInputCommandInteraction<CacheType>, client: Client): Promise<boolean> {
        client.logger.send(`[COMMANDS|${this.name.toUpperCase()}|${interaction.user.id}] ${this.usage}`);
		if (!interaction.guild || !interaction.member) return _replyNullGuild(interaction);

        const channel: ForumChannel | null = await getChannel(ForumChannel, client.channels, channel_mods);
        if (!channel) return _replyNullChannel(interaction);

        channel.edit({
            name: "「🤖」модераторская",
            position: 2,
            parent: null,
            permissionOverwrites: [
                {
                    id: main_guild,
                    type: OverwriteType.Role,
                    deny: [ PermissionFlagsBits.ViewChannel ]
                },
                {
                    id: role_server_mods,
                    type: OverwriteType.Role,
                    allow: [ PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.SendMessagesInThreads ]
                },
                {
                    id: role_server_admins,
                    type: OverwriteType.Role,
                    allow: [ PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.SendMessagesInThreads ]
                },
                {
                    id: role_botowner_bot,
                    type: OverwriteType.Role,
                    deny: [ PermissionFlagsBits.ViewChannel ]
                }
            ]
        });
        channel.setDefaultSortOrder(SortOrderType.CreationDate);

        const threads = (await channel.threads.fetch()).threads;
        threads.forEach((t) => t.delete().catch(() => {}));

        // Логи сообщений
        let thread = await channel.threads.create({
            name: 'Логи сообщений',
            autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
            message: {
                content: "Удаление / изменение сообщений."
            }
        }).catch(() => {});
        client.db.set("mods_thread_messages", `${thread?.id}`);

        // RoomCreator
        thread = await channel.threads.create({
            name: 'Логи RoomCreator`а',
            autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
            message: {
                content: "Создание / удаление каналов."
            }
        }).catch(() => {});
        client.db.set("mods_thread_roomcreator", `${thread?.id}`);

        // Заявки на инвайт ботов
        thread = await channel.threads.create({
            name: 'Заявки Ботоводов',
            autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
            message: {
                content: "Заявки на приглашение ботов."
            }
        }).catch(() => {});
        client.db.set("mods_thread_botowners", `${thread?.id}`);

        return deferReply(interaction);
    }
}