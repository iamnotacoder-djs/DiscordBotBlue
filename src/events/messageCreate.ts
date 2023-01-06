import { ChannelType, Events, Message, OverwriteResolvable, OverwriteType, PermissionFlagsBits, TextChannel, ThreadChannel } from "discord.js";
import BaseCommand from "../structures/handlers/BaseCommand";
import Client from "../structures/overwrite/Client";
import { BaseEvent, LevelSystemAddOptions } from "../structures/Types";
import { CommandType, message_prefix, _replyCommandError } from "../utils/ConfigUtil";
import { channel_archive_roomcreator, channel_feed, channel_feed_b0, channel_feed_b2, channel_feed_opensource, channel_hub_memes, main_guild, role_botowner_bot, role_support_b2, role_support_b3, role_support_boosty } from "../utils/IDs";

const event: BaseEvent = {
    name: Events.MessageCreate,
    once: false,
    async execute(client: Client, message: Message) {
        if (client.cron.checkTime()) client.cron.doActions(client);

        // Автоматическое раскрытие feed-каналов
        if (message.channel instanceof TextChannel && message.channel.parentId == channel_feed) {
            let array: OverwriteResolvable[] = [
                {
                    id: main_guild,
                    type: OverwriteType.Role,
                    allow: [ PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AddReactions ],
                    deny: [ PermissionFlagsBits.SendMessages, PermissionFlagsBits.UseApplicationCommands ]
                },
                {
                    id: role_botowner_bot,
                    type: OverwriteType.Role,
                    deny: [ PermissionFlagsBits.ViewChannel ]
                }
            ];
            if (message.channelId == channel_feed_b0) {
                array = [
                    {
                        id: role_support_boosty,
                        type: OverwriteType.Role,
                        allow: [ PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AddReactions ],
                        deny: [ PermissionFlagsBits.SendMessages, PermissionFlagsBits.UseApplicationCommands ]
                    },
                    {
                        id: main_guild,
                        type: OverwriteType.Role,
                        deny: [ PermissionFlagsBits.ViewChannel ]
                    },
                    {
                        id: role_botowner_bot,
                        type: OverwriteType.Role,
                        deny: [ PermissionFlagsBits.ViewChannel ]
                    }
                ];
            }
            if (message.channelId == channel_feed_b2) {
                array = [
                    {
                        id: role_support_b2,
                        type: OverwriteType.Role,
                        allow: [ PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AddReactions ],
                        deny: [ PermissionFlagsBits.SendMessages, PermissionFlagsBits.UseApplicationCommands ]
                    },
                    {
                        id: role_support_b3,
                        type: OverwriteType.Role,
                        allow: [ PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AddReactions ],
                        deny: [ PermissionFlagsBits.SendMessages, PermissionFlagsBits.UseApplicationCommands ]
                    },
                    {
                        id: main_guild,
                        type: OverwriteType.Role,
                        deny: [ PermissionFlagsBits.ViewChannel ]
                    },
                    {
                        id: role_botowner_bot,
                        type: OverwriteType.Role,
                        deny: [ PermissionFlagsBits.ViewChannel ]
                    }
                ];
            }
            message.channel.permissionOverwrites.set(array).catch(() => {});
        }
        
        if (message.author.id == client.user.id) return;
        if (message.channelId == channel_archive_roomcreator) {
            const channel_id = await client.db.get<string>(`mods_thread_roomcreator`);
            if (channel_id) {
                const channel = await client.channels.fetch(channel_id).catch(() => {});
                if (channel instanceof ThreadChannel) {
                    if (channel.archived) await channel.setArchived(false);
                    channel.send({
                        content: message.content,
                        embeds: message.embeds,
                        allowedMentions: { roles: [], users: [] }
                    }).catch(() => {});
                }
            }
        }
        if (message.author.bot) return;
        
        // Анти-инвайты 
        const regDiscordURL = message.content.match(/((https*:\/\/)*discord(app)*\.(gg|com)\/(invite\/)*)([a-zA-Z0-9]*)(\/{0,1})($|\n|\s)/m);
        if (regDiscordURL && message.guild) {
            const code = regDiscordURL[6], 
                invites = (await message.guild.invites.fetch() ?? []).map((i) => i?.code);
            if (invites.includes(code)) {
                // do nothing
            } else if (['developers', 'login'].includes(code)) {
                // do nothing
            } else {
                return message.delete().catch(() => {});
            }
        }

        // Команды
        message.content = message.content.replaceAll(`<@${client.user.id}>`, "").trim();
        const messageArguments: string[] = message.content.slice(message_prefix.length).trim().split(/ +/g);
        const commandName: string = `${messageArguments.shift()}`;
        const command: BaseCommand | undefined = client.commands.get(commandName);

        if (command && command.type.includes(CommandType.Message)) {
            command.onMessageCreate(message, command.requireClient ? client : undefined).catch((error) => _replyCommandError(error, client.logger, commandName, `${message?.guildId}`, message));
        }

        // Публикация мемов
        if (message.channel.id == channel_hub_memes) {
            if (message.attachments.size != 0) {
                message.startThread({
                    name: `Комментарии`
                }).catch(() => {});
                message.react('♥️').catch(() => {});
            } else {
                message.delete().catch(() => {});
            }
        }

        // Публикация опенсорс
        if (message.channel.id == channel_feed_opensource) {
            if (message.content.includes('http') || message.content.includes('```')) {
                message.startThread({
                    name: `Комментарии`
                }).catch(() => {});
                message.react('♥️').catch(() => {});
                if (message.crosspostable) message.crosspost();
            } else {
                message.delete().catch(() => {});
            }
        }
        
        // Стата
        if (message.channel.type != ChannelType.DM) {
            message = (await message.fetch().catch(() => {})) ?? message;

            // Как минимум зачисляем сообщение
            let upd: LevelSystemAddOptions = { messages: 1 };

            // Эмодзи
            const emj = message.content.match(/(<:)(.{1,33})(:)([01-9]{1,18})(>)/g);
            if (emj != null) upd.emojis = emj.length;
            
            // Вложения
            if (message.attachments.size != 0) upd.pictures = message.attachments.size ?? 0;
            
            // Стикеры
            if (message.stickers.size != 0) upd.stickers = message.stickers.size;
            
            client.lvls.add(message.author.id, upd);
        }
    
    }
}

export default event;
