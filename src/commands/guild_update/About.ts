import { ActionRowBuilder, APISelectMenuOption, ApplicationCommand, ApplicationCommandData, ApplicationCommandType, AttachmentBuilder, ButtonBuilder, ButtonStyle, CacheType, ChatInputCommandInteraction, ForumChannel, OverwriteType, PermissionFlagsBits, SortOrderType, StringSelectMenuBuilder, ThreadAutoArchiveDuration } from "discord.js";
import fs from 'fs';
import BaseCommand from "../../structures/handlers/BaseCommand";
import Client from "../../structures/overwrite/Client";
import { CommandType, deferReply, getChannel, _replyNullChannel, _replyNullGuild } from "../../utils/ConfigUtil";
import { channel_about, main_guild, roles_botowner, roles_colors, roles_event, roles_server, roles_support, role_botowner_bot, role_event_toxic } from "../../utils/IDs";

export default class About extends BaseCommand {

    // Основные параметры
	name: string = "about";
	usage: string = "Заполнить канал About";
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

        const channel: ForumChannel | null = await getChannel(ForumChannel, client.channels, channel_about);
        if (!channel) return _replyNullChannel(interaction);

        channel.edit({
            name: "「📓」о-сервере",
            position: 1,
            parent: null,
            permissionOverwrites: [
                {
                    id: main_guild,
                    type: OverwriteType.Role,
                    allow: [ PermissionFlagsBits.ViewChannel, PermissionFlagsBits.CreateInstantInvite, PermissionFlagsBits.AddReactions, PermissionFlagsBits.UseExternalEmojis, PermissionFlagsBits.ReadMessageHistory ],
                    deny: [ PermissionFlagsBits.SendMessages, PermissionFlagsBits.SendMessagesInThreads, PermissionFlagsBits.UseApplicationCommands ]
                },
                {
                    id: role_botowner_bot,
                    type: OverwriteType.Role,
                    deny: [ PermissionFlagsBits.ViewChannel ]
                }
            ]
        });
        channel.setDefaultSortOrder(SortOrderType.CreationDate);

        channel.setAvailableTags([ { name: "Правила" }, { name: "Оповещения" }, { name: "Инструкция" } ]);
        const threads = (await channel.threads.fetch()).threads;
        threads.forEach((t) => t.delete().catch(() => {}));


        let topic = "Правила сервера $URL1" + "\n" +
                    "Новости сервера $URL2" + "\n" +
                    "Новоприбывшие $URL3" + "\n" +
                    "Роли $URL4" + "\n" +
                    "Бонусы подписки $URL5" + "\n" +
                    "Статистика $URL6" + "\n" +
                    "Правила приглашения ботов $URL7" + "\n" +
                    "Система уровней $URL8";

        // Система уровней
        let cmd: ApplicationCommand | undefined = client.application.commands.cache.find((c: ApplicationCommand) => c.name === 'profile');
        let thread = await channel.threads.create({
            name: 'Система уровней',
            autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
            message: {
                content: "На сервере работает система уровней, которая открывает доступ к различным способам кастомизации своего профиля и бонусам." + "\n\n" + "**Как посмотреть свой уровень?**" + "\n" + `С помощью команды ${cmd ? `</${cmd.name}:${cmd.id}>` : "`/profile`" } ты можешь открыть профиль любого пользователя.` + "\n\n" + "**Как фармить уровень?**" + "\n" + "За любые действия на сервере:" + "\n" + "> Отправка сообщений" + "\n" + "> Прикрепление эмодзи, стикеров и файлов" + "\n" + "> Общение в голосовом чате" + "\n" + "… и некоторые другие активности, тебе начисляется опыт. До 60го уровня кол-во опыта, необходимого для повышения лвл-а - равно 1000. Для получения 61го и выше - потребуется больше опыта. Максимальный уровень - 120." + "\n\n" + "**Какие есть бонусы за повышение уровня?**" + "\n" + "10+ - возможность создавать голосования и опросы." + "\n" + "20+ - возможность пригласить своего бота на сервер." + "\n" + "30+ - доступ к команде /selfsacrifice" + "\n" + "50+ - выбор цветной роли. При её получении открывается возможность встраивать ссылки, использовать внешние эмодзи, стикеры и др." + "\n" + "60+ - возможность изменить фон профиля." + "\n\n" + "**Почему бот не получает опыт?**" + "\n" + "По аналогии с политикой Discord - боты имеют свой профиль, однако какой-либо опыт получать не способы. Взаимодействие с ними, присваивается пользователю." + "\n\n" + "**Почему мой уровень понизился?**" + "\n" + "Первого числа каждого месяца происходит автоматический сброс уровней всех участников сервера:" + "\n" + "> с 1 по 9 - снижается до 1," + "\n" + "> с 10 по 19 - снижается до 10" + "\n" + "> с 20 по 29 - снижается до 20" + "\n" + "> с 30 до 120 - снижается до 30." + "\n" + "При ливе с сервера также производится сброс." + "\n\n---",
                components: [
                    new ActionRowBuilder<ButtonBuilder>()
                        .addComponents([
                            new ButtonBuilder()
                                .setCustomId("button_profile_my")
                                .setLabel("Открыть профиль")
                                .setStyle(ButtonStyle.Primary)
                        ])
                ],
                files: [ new AttachmentBuilder("./assets/about_lvl.png", { name: "about_lvl.png" }) ]
            }
        }).catch(() => {});
        if (thread && thread.lastMessage) topic = topic.replace("$URL8", thread.lastMessage.url);
        
        // Приглашение ботов
        cmd = client.application.commands.cache.find((c: ApplicationCommand) => c.name === 'botowner');
        thread = await channel.threads.create({
            name: 'Правила приглашения ботов',
            autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
            message: {
                content: "Опытные пользователи этого сервера с уровнем 30 и выше, могут пригласить своего бота на Не ITшники: Хвастаться, рекламировать и тестить свои команды здесь." + `\n${cmd ? `</${cmd.name}:${cmd.id}>` : "`/botowner`" }` + "\n\n" + "**Стоит соблюдать пару правил:**" + "\n\n" + "> Приглашать можно только своих ботов. Если увижу бота на лям серверов - устрою допрос." + "\n\n" + "> Добавить бота - это значит взять полную ответственность за его действия. Нарушение правил сообщества Discord, условий использования Discord или правил сервера приведет к блокировке аккаунта." + "\n\n" + "> Частое переприглашение ботов под запретом. Просьбы: кикни этого бота и пригласи другого - мы не терпим." + "\n\n" + "> Бот может быть автоматически выгнан с сервера после 45 (иногда 30) дней инактивности. Под активностью считаются: отправка сообщений / вход в голосовой чат." + "\n\n" + "> Бот может быть изгнан с сервера за многочисленные жалобы на спам." + "\n\n" + "> Нужны особые права для бота? Обращайся к модераторам." + "\n\n---",
                files: [ new AttachmentBuilder("./assets/about_bot.png", { name: "about_bot.png" }) ],
                components: [
                    new ActionRowBuilder<ButtonBuilder>()
                        .addComponents([
                            new ButtonBuilder()
                                .setCustomId("button_botowners_invite")
                                .setLabel("Пригласить бота")
                                .setStyle(ButtonStyle.Primary)
                        ])
                ]
            }
        }).catch(() => {});
        if (thread && thread.lastMessage) topic = topic.replace("$URL7", thread.lastMessage.url);
        
        // Статистика
        thread = await channel.threads.create({
            name: 'Статистика',
            autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
            message: {
                content: "Статистика обновляется автоматически раз в час." + "\n\n---",
                files: [ new AttachmentBuilder("./assets/about_stats.png", { name: "about_stats.png" }) ]
            }
        }).catch(() => {});
        if (thread && thread.lastMessage) topic = topic.replace("$URL6", thread.lastMessage.url);
        client.db.set("about_thread_stats", `${thread?.id}`);
        
        // Бонусы подписки
        cmd = client.application.commands.cache.find((c: ApplicationCommand) => c.name === 'role');
        thread = await channel.threads.create({
            name: 'Бонусы подписки',
            autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
            message: {
                content: "На данный момент существует два способа поддержать сервер финансово: **подписка на Boosty.to** и **Nitro-буст**." + "\n\n" + "**Boosty.to**" + "\n" + "Подписка на boosty.to разделена на несколько уровней:" + "\n" + "B0 - открывает доступ к приватным чатам и предоставляет специальную роль, предоставляющую бонусы эквивалентные 60-му уровню на сервере." + "\n" + "B1 - возможность создать свою уникальную роль на сервере (произвольные название и иконка, не нарушающие правилам сервера)." + `${cmd ? `</${cmd.name}:${cmd.id}>` : "`/role`" }` + "\n" + "B2 - доступ к переключателю `hoist` для кастомных ролей (Выделять роль в списке пользователей)." + "\n" + "B3 - TBD." + "\n\n" + "**Nitro-буст сервера**" + "\n" + "Бонусы эквивалентны уровню B1 подписки на Boosty.to." + "\n\n---",
                components: [
                    new ActionRowBuilder<ButtonBuilder>()
                        .addComponents([
                            new ButtonBuilder()
                                .setLabel("Boosty.to")
                                .setURL("https://boosty.to/iamnotacoder")
                                .setStyle(ButtonStyle.Link)
                        ])
                ],
                files: [ new AttachmentBuilder("./assets/about_boost.png", { name: "about_boost.png" }) ]
            }
        }).catch(() => {});
        if (thread && thread.lastMessage) topic = topic.replace("$URL5", thread.lastMessage.url);
        
        // Роли
        let options: APISelectMenuOption[] = [];
        for(let role_id of roles_colors) {
            const role = await interaction.guild.roles.fetch(role_id).catch(() => {});
            if (role) options.push({
                label: role.name,
                value: role_id
            });
        }
        thread = await channel.threads.create({
            name: 'Роли',
            autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
            message: {
                content: "**Обслуживающий персонал сервера**:" + "\n" + roles_server.map((r) => `<@&${r}>`).join(", ") + "\n\n" + "**Роли саппортеров:**" + "\n" + roles_support.map((r) => `<@&${r}>`).join(", ") + (thread && thread.lastMessage ? "\n" + "Подробнее о них можешь посмотреть тут:" + "\n" + thread.lastMessage.url : "") + "\n" + "Все саппорт-роли выдаются и снимаются автоматически." + "\n\n" + "**Цветные роли**:" + "\n" + roles_colors.map((r) => `<@&${r}>`).join(", ") + "\n\n" + "**Особые роли**:" + "\n" + roles_event.map((r) => `<@&${r}>`).join(", ") + "\n" + `<@&${role_event_toxic}> можно получить самостоятельно по достижению 30го уровня, однако снять её уже не получится.` + "\n\n" + "**Приглашение ботов**:" + "\n" + roles_botowner.map((r) => `<@&${r}>`).join(", ") + "\n\n---",
                components: [
                    new ActionRowBuilder<StringSelectMenuBuilder>()
                        .addComponents([
                            new StringSelectMenuBuilder()
                                .setCustomId("select_color_roles")
                                .setMinValues(0)
                                .setMaxValues(1)
                                .setPlaceholder("Выбери цветную роль [LVL 50+]")
                                .setOptions(options.splice(0, options.length > 25 ? 25 : options.length))
                        ])
                ],
                files: [ new AttachmentBuilder("./assets/about_roles.png", { name: "about_roles.png" }) ],
                allowedMentions: {
                    roles: [],
                    users: []
                }
            }
        }).catch(() => {});
        if (thread && thread.lastMessage) topic = topic.replace("$URL4", thread.lastMessage.url);

        // Новоприбывшие
        thread = await channel.threads.create({
            name: 'Новоприбывшие',
            autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
            message: {
                content: "Поприветствуем новичков на сервере!" + "\n\n---",
                files: [ new AttachmentBuilder("./assets/about_joined.png", { name: "about_joined.png" }) ]
            }
        }).catch(() => {});
        if (thread && thread.lastMessage) topic = topic.replace("$URL3", thread.lastMessage.url);
        client.db.set("about_thread_joined", `${thread?.id}`);

        // Новости сервера
        thread = await channel.threads.create({
            name: 'Новости сервера',
            autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
            message: {
                content: "Новости и оповещения об обновлении сервера!" + "\n\n---",
                files: [ new AttachmentBuilder("./assets/about_news.png", { name: "about_news.png" }) ]
            }
        }).catch(() => {});
        if (thread && thread.lastMessage) topic = topic.replace("$URL2", thread.lastMessage.url);
        client.db.set("about_thread_news", `${thread?.id}`);

        // Новости сервера
        let rulesMessage = await fs.promises.readFile("./assets/rules.txt").catch(console.error) ?? "TBD";
        thread = await channel.threads.create({
            name: 'Правила сервера',
            autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
            message: {
                content: `${rulesMessage}` + "\n\n---",
                files: [ new AttachmentBuilder("./assets/about_rules.png", { name: "about_rules.png" }) ]
            }
        }).catch(console.error);
        if (thread && thread.lastMessage) topic = topic.replace("$URL1", thread.lastMessage.url);

        channel.setTopic(topic);
        return deferReply(interaction);
    }
}