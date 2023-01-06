import { AuditLogEvent, ChannelType, Events, GuildAuditLogsEntry, Message, ThreadChannel, User } from "discord.js";
import Client from "../structures/overwrite/Client";
import Embed from "../structures/overwrite/EmbedBuilder";
import { BaseEvent, LevelSystemAddOptions } from "../structures/Types";

const event: BaseEvent = {
    name: Events.MessageDelete,
    once: false,
    async execute(client: Client, message: Message) {
        const author: User | null = message.author; // PartialMessage | Message
        if (!author) return;

        // Стата
        if (message.channel.type != ChannelType.DM && !author.bot) {
            message = (await message.fetch().catch(() => {})) ?? message;

            // Как минимум зачисляем сообщение
            let upd: LevelSystemAddOptions = { messages: -1 };

            // Эмодзи
            const emj = message.content.match(/(<:)(.{1,33})(:)([01-9]{1,18})(>)/g);
            if (emj != null) upd.emojis = emj.length * -1;
            
            // Вложения
            if (message.attachments.size != 0) upd.pictures = message.attachments.size * -1;
            
            // Стикеры
            if (message.stickers.size != 0) upd.stickers = message.stickers.size * -1;
            
            client.lvls.add(author.id, upd);
        }
        
        if (!message.guild) setTimeout(async () => {
            const fetchedLogs = await message.guild!.fetchAuditLogs({
                limit: 6,
                type: AuditLogEvent.MessageDelete
            }).catch(() => {});
            if (fetchedLogs == undefined) return;

            let auditEntry: GuildAuditLogsEntry<AuditLogEvent.MessageDelete> | null = null;
            for(let a of fetchedLogs.entries.map((m) => m)) {
                if (a.target.id === author.id && a.extra.channel.id === message.channel.id && (Date.now() - a.createdTimestamp) < 20000) auditEntry = a;
            }
            let executor = 'Неизвестно / Автор';
            if (auditEntry && auditEntry.executor) executor = `<@${auditEntry.executor.id}>`;

            const DeleteEmbed = new Embed()
                .setTitle('Удаление сообщения')
                .setFields([
                    {
                        name: 'Автор',
                        value: `<@${author.id}>`,
                        inline: true
                    },
                    {
                        name: 'Удалил',
                        value: executor,
                        inline: true
                    },
                    {
                        name: 'Канал',
                        value: `<#${message.channel.id}>`,
                        inline: true
                    },
                    {
                        name: 'Текст сообщения',
                        value: `\`\`\`message\n${message.content.substring(0, 1020)}\`\`\``,
                        inline: false
                    }
                ]);

            const channel_id = await client.db.get<string>(`mods_thread_messages`);
            
            if (channel_id) {
                const channel = await client.channels.fetch(channel_id).catch(() => {});
                if (channel instanceof ThreadChannel) {
                    if (channel.archived) await channel.setArchived(false);
                    channel.send({
                        embeds: [ DeleteEmbed ],
                        stickers: message.stickers.map((m) => m),
                        files: message.attachments.map((m) => m)
                    }).catch(() => {});
                }
            }
        }, 5000);
    
    }
}

export default event;
