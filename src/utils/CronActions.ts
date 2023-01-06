import { ChannelType, Collection, GuildEmoji, GuildPremiumTier, NewsChannel, NonThreadGuildBasedChannel, Snowflake, Sticker, ThreadChannel } from "discord.js";
import fs from "fs";
import Parser from "rss-parser";
import Client from "../structures/overwrite/Client";
import Embed from "../structures/overwrite/EmbedBuilder";
import { HabrPost } from "../structures/Types";
import { validURL } from "./ConfigUtil";
import { channel_feed_habr, main_guild } from "./IDs";

export default class CronActions {

    delay = 1000 * 60 * 60;
    lastAction: number;
    parser = new Parser();

	/**
	 * Создает экземпляр CronActions
	 */
    constructor() {
        this.lastAction = Date.now() - this.delay;
    }

    checkTime() {
        return Date.now() - this.lastAction >= this.delay;
    }

    async doActions(client: Client) {
        if (Date.now() - this.lastAction < this.delay) return;
        const _lastAction = await client.db.get<number>(`cron_actions_last`) ?? this.lastAction;
        if (Date.now() - _lastAction < this.delay) return;

        this.lastAction = Date.now();
        client.db.set<number>(`cron_actions_last`, this.lastAction);

        client.logger.send(`[CRONACTIONS] Запуск CronActions.`);

        this.#updateServerStats(client).catch((error: Error) => client.logger.error("[CRONACTIONS|SERVERSTATS]", error));
        this.#updateServerBanner(client).catch((error: Error) => client.logger.error("[CRONACTIONS|SERVERBANNER]", error));
        this.#postHabrLogs(client).catch((error: Error) => client.logger.error("[CRONACTIONS|HABR]", error));
    }

    async #updateServerStats(client: Client) {
        const channel_id = await client.db.get<string>(`about_thread_stats`);
        if (channel_id) {
            const channel = await client.channels.fetch(channel_id);
            if (channel instanceof ThreadChannel) {
                if (channel.archived) await channel.setArchived(false);
                const statsMessage = await channel.fetchStarterMessage();
                if (!statsMessage) return;
                
                let cur = channel.guild.memberCount, max = 0;
                if (cur < 50) { max = 50; } else if (cur < 100) { max = 100; } else if (cur < 200) { max = 200; } else if (cur < 300) { max = 300; } else if (cur < 500) { max = 500; } else if (cur < 1000) { max = 1000; } else if (cur < 2000) { max = 2000; } else if (cur < 5000) { max = 5000; } else if (cur < 10000) { max = 10000; } else { max = 99999; }
                const roles = (await channel.guild.roles.fetch()).sort((a, b) => b.position - a.position).map(role => role.toString()) ?? [];
                const channels = await channel.guild.channels.fetch().catch(() => {}) ?? new Collection<Snowflake, NonThreadGuildBasedChannel | null>();
                const emojis = await channel.guild.emojis.fetch().catch(() => {}) ?? new Collection<Snowflake, GuildEmoji>();
                const stickers = await channel.guild.stickers.fetch().catch(() => {}) ?? new Collection<Snowflake, Sticker>();
                let roles_list = '';
                for(let i = 0; i < roles.length; i++) {
                    if (`${roles_list}, ${roles[i]}`.length < 1021) {
                        roles_list += `${i != 0 ? ', ': ''}${roles[i]}`;
                    } else {
                        roles_list += `...`;
                        break;
                    }
                }
                const result = await statsMessage.edit({
                    embeds: [
                        new Embed()
                            .setTitle(`Статистика`)
                            .setDescription(`**${channel.guild.name}** - ${channel.guild.description}\n **Участников:** 「👨」 ${cur} 「🎯」 ${max} \n **ID** ${channel.guild.id} \n **Владелец** <@${channel.guild.ownerId}> (ID: ${channel.guild.ownerId}) \n **Уровень буста** ${channel.guild.premiumTier != GuildPremiumTier.None ? `Тир ${channel.guild.premiumTier}` : 'Нет'} \n **Фильтр контента** ${{
                                0: 'Выключен',
                                1: 'Участников без роли',
                                2: 'Всех участников'
                            }[channel.guild.explicitContentFilter]} \n **Уровень проверки** ${{
                                0: 'Нет',
                                1: 'Низкий',
                                2: 'Средний',
                                3: 'Высокий',
                                4: 'Самый высокий'
                            }[channel.guild.verificationLevel]} \n **Дата создания** <t:${~~(channel.guild.createdTimestamp/1000)}:F> <t:${~~(channel.guild.createdTimestamp/1000)}:R>`)
                            .addFields([
                                {
                                    name: `Статистика`,
                                    value: `**Кол-во ролей** ${ roles.length } \n **Эмодзи** ${ emojis instanceof Collection ? emojis.size : 0 } \n **Стикеров** ${ stickers instanceof Collection ? stickers.size: 0 } \n **Текстовых каналов** ${ channels.filter((channel) => [ ChannelType.GuildText, ChannelType.GuildForum, ChannelType.GuildAnnouncement ].includes(channel ? channel.type : -1)).size } \n **Голосовых каналов** ${ channels.filter((channel) => [ ChannelType.GuildVoice, ChannelType.GuildStageVoice ].includes(channel ? channel.type : -1)).size }`
                                }, {
                                    name: `Роли [${roles.length - 1}]`,
                                    value: roles_list
                                }
                            ])
                            .setThumbnail(channel.guild.iconURL({ extension: "gif" }))
                    ]
                });
                if (result) client.logger.send("[CRONACTIONS|SERVERSTATS] Статистика успешно обновлена");
            }
        }
    }

    async #updateServerBanner(client: Client) {
        const guild = await client.guilds.fetch(main_guild);
        if (!guild || !guild.premiumSubscriptionCount) return;
        const lastName = await client.db.get<string>(`banner_last_name`) ?? ``;
        let tag = 's';
        // if (guild.premiumSubscriptionCount >= 14) tag = 'a';
        if (guild.premiumSubscriptionCount >= 7) {
            let files = fs.readdirSync(`./assets/banners/${tag}/`)
            let nextFileByName = files[0],
                found = files.findIndex((el) => { return el == lastName.replace('.png', '.gif') || el == lastName.replace('.gif', '.png'); });
            
            if (found == -1) nextFileByName = files[0];
            if (found < files.length - 1) nextFileByName = files[found + 1];
            if (found === files.length - 1) nextFileByName = files[0];
            client.db.set<string>(`banner_last_name`, nextFileByName);

            const result = await guild.setBanner(`./assets/banners/${tag}/${nextFileByName}`);
            if (result) client.logger.send(`[CRONACTIONS|SERVERBANNER] Баннер сервера успешно обновлен - \`${tag}/${nextFileByName}\`.`);
        }
    }

    async #postHabrLogs(client: Client) {
        const db = await client.db.get<HabrPost[]>(`habr_news_posts`) ?? [];
        let feed = (await this.parser.parseURL('http://habrahabr.ru/rss/news').catch(() => {})) ?? { items: [] };
        for (let item of feed.items.reverse()) {
            if (!item.content || !item.guid || !item.contentSnippet || !item.title) continue;
            const regexp = item.guid.match(/\d/g);
            const post: HabrPost = { 
                id: parseInt(regexp ? regexp.join('') : ""),
                content: item.content,
                contentSnippet: item.contentSnippet,
                title: item.title,
                date: Date.now()
            };

            if (!db.find((_post) => _post.id == post.id)) {

                let extension = "png";
                if (post.content.includes(".png")) {
                    extension = "png";
                } else if (post.content.includes(".jpeg")) {
                    extension = "jpeg";
                } else if (post.content.includes(".jpg")) {
                    extension = "jpg";
                } else if (post.content.includes(".gif")) {
                    extension = "gif";
                } 
    
                let imageURL = post.content.substring(0, post.content.indexOf(`.${extension}`) + 1 + extension.length);
                imageURL = imageURL.substring(imageURL.lastIndexOf("http"));
                
                if (validURL(imageURL)) {
                    const channel = await client.channels.fetch(channel_feed_habr);
                    if (channel instanceof NewsChannel) {
                        const message = await channel.send({
                            embeds: [
                                new Embed()
                                    .setTitle(post.title)
                                    .setDescription(post.contentSnippet)
                                    .setURL(item.guid)
                                    .setImage(imageURL)
                            ]
                        });
                        if (message) {
                            await client.db.push<HabrPost>(`habr_news_posts`, post);
                            if (message.crosspostable) message.crosspost().catch(() => {});
                            message.startThread({
                                name: post.title.length > 100 ? post.title.substring(0, 95) + "…" : post.title
                            }).catch(() => {});
                        }
                    }
                }
            }
        }
        client.db.set<HabrPost[]>(`habr_news_posts`, (await client.db.get<HabrPost[]>(`habr_news_posts`) ?? []).filter((_post) => Date.now() - _post.date <= 1000 * 60 * 60 * 24 * 30));
    }
}