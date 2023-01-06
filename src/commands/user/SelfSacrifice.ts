import { ActionRowBuilder, AnySelectMenuInteraction, ApplicationCommandData, ApplicationCommandType, AttachmentBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, CacheType, ChatInputCommandInteraction, StringSelectMenuBuilder } from "discord.js";
import { evaluate } from "mathjs";
import BaseCommand from "../../structures/handlers/BaseCommand";
import Client from "../../structures/overwrite/Client";
import Embed from "../../structures/overwrite/EmbedBuilder";
import { SelfSacrificeStats } from "../../structures/Types";
import { CommandType } from "../../utils/ConfigUtil";
import { main_guild, role_event_toxic } from "../../utils/IDs";

export default class SelfSacrifice extends BaseCommand {
    

    // Основные параметры
	name: string = "selfsacrifice";
	usage: string = "Меню для извращенцев (SFW) [LVL: 30]";
    type: string[] = [ CommandType.SlashApplication ];
	slash: ApplicationCommandData = {
		name: this.name,
		description: this.usage,
		type: ApplicationCommandType.ChatInput,
		options: [],
		dmPermission: true
	};
    requireClient: boolean = true;
    buttons: string[] = [ "button_selfsacrifice_kick", "button_selfsacrifice_toxic" ];
	selects: string[] = [ "select_selfsacrifice_timeout" ];

	constructor() { super(); }

    async onChatInputCommand(interaction: ChatInputCommandInteraction<CacheType>, client: Client): Promise<boolean> {
		let dbStats = await client.db.get<SelfSacrificeStats>(`selfsacrifice_stats`);
		if (!dbStats) {
            dbStats = { toxics: 0, kicks: 0, timouts: 0, members: [] }
            client.db.set<SelfSacrificeStats>(`selfsacrifice_stats`, dbStats);
        }

		const profile = await client.lvls.get(interaction.user.id);

		interaction.reply({
			embeds: [ 
                new Embed()
                    .setTitle("Меню извращенцев")
                    .setDescription(
                        "**С помощью этого меню ты действительно можешь получить бан или быть выкинут с сервера, а так же получить таймаут!**" + "\n" + 
                        "Все что будет после нажатия на кнопку - на твоей совести!" + "\n\n" + 
                        "В целях безопасности мы оградили доступ к этому меню новичкам сервера." + "\n\n" +
                        "По кнопке \"Токсик\" - можно получить одноименную роль со специфичным цветом и иконкой. Учти, снять её будет невозможно!" + "\n\n" +
                        "На кнопках указано кол-во глупцов нажавших на них в течении этого дня."
                    )
                    .setImage(`attachment://selfsacrifice.gif`)
             ], 
			files: [ new AttachmentBuilder('./assets/selfsacrifice.gif', { name: `selfsacrifice.gif` }) ],
			components: [
				new ActionRowBuilder<ButtonBuilder>()
					.addComponents([
						new ButtonBuilder()
							.setCustomId("button_selfsacrifice_toxic")
							.setStyle(ButtonStyle.Secondary)
							.setLabel(`Токсик [${dbStats.toxics ?? 0}]`)
							.setDisabled(profile.lvl < 30),
                        new ButtonBuilder()
                            .setCustomId("button_selfsacrifice_kick")
                            .setStyle(ButtonStyle.Danger)
                            .setLabel(`Кик [${dbStats.kicks ?? 0}]`)
                            .setDisabled(profile.lvl < 30)
					]),
                new ActionRowBuilder<StringSelectMenuBuilder>()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId("select_selfsacrifice_timeout") 
                            .setMinValues(1)
                            .setMaxValues(1)
                            .setPlaceholder(`На какой срок выдать Таймаут? [${dbStats.timouts}]`)
                            .setDisabled(profile.lvl < 30)
                            .setOptions([
                                {
                                    label: "Минута",
                                    value: "1000 * 60"
                                }, 
                                {
                                    label: "10 минут",
                                    value: "1000 * 60 * 10"
                                }, 
                                {
                                    label: "1 час",
                                    value: "1000 * 60 * 60"
                                }, 
                                {
                                    label: "3 часа",
                                    value: "1000 * 60 * 60 * 3"
                                }, 
                                {
                                    label: "1 день",
                                    value: "1000 * 60 * 60 * 24"
                                }, 
                                {
                                    label: "7 дней",
                                    value: "1000 * 60 * 60 * 24 * 7"
                                }, 
                                {
                                    label: "14 дней",
                                    value: "1000 * 60 * 60 * 24 * 14"
                                }, 
                                {
                                    label: "28 дней",
                                    value: "1000 * 60 * 60 * 24 * 28 - 1000"
                                }
                            ])
                    )
			],
			ephemeral: true
		});
        client.logger.send(`[COMMANDS|${this.name.toUpperCase()}|${interaction.user.id}] ${interaction.user.username} ${this.usage} (${interaction.user.id})`);

        return true;
    }

    async onButtonComponent(interaction: ButtonInteraction<CacheType>, client: Client): Promise<boolean> {
		let dbStats = await client.db.get<SelfSacrificeStats>(`selfsacrifice_stats`);
		if (!dbStats) {
            dbStats = { toxics: 0, kicks: 0, timouts: 0, members: [] }
            client.db.set<SelfSacrificeStats>(`selfsacrifice_stats`, dbStats);
        }

        if (interaction.customId == "button_selfsacrifice_kick") {
            const guild = await client.guilds.fetch(main_guild);
            const member = await guild.members.fetch(interaction.user.id).catch(() => {});
            if (member) {
                const result = await member.kick();
                if (result) {
                    dbStats.kicks++;
                    dbStats.members.push(interaction.user.id);
                    client.db.set<SelfSacrificeStats>(`selfsacrifice_stats`, dbStats);
                    interaction.deferUpdate().catch(() => {});
                    client.logger.send(`[COMMANDS|${this.name.toUpperCase()}|${interaction.user.id}|BUTTON|${interaction.customId.toUpperCase()}] ${interaction.user.username} ${this.usage}`);
                } else {
                    interaction.reply({
                        content: "Что-то пошло не так.",
                        ephemeral: true
                    });
                    client.logger.error(`[COMMANDS|${this.name.toUpperCase()}|${interaction.user.id}|BUTTON|${interaction.customId.toUpperCase()}]`, new Error(`Не удалось кикнуть <@${interaction.user.id}> ${interaction.user.id}.`));
                }
            } else {
                interaction.reply({
                    content: "Что-то пошло не так.",
                    ephemeral: true
                });
                client.logger.error(`[COMMANDS|${this.name.toUpperCase()}|${interaction.user.id}|BUTTON|${interaction.customId.toUpperCase()}]`, new Error(`Пользователь не найден <@${interaction.user.id}> ${interaction.user.id}.`));
            }
            return true;
        }
        if (interaction.customId == "button_selfsacrifice_toxic") {
            const guild = await client.guilds.fetch(main_guild);
            const member = await guild.members.fetch(interaction.user.id).catch(() => {});
            if (member) {
                const result = await member.roles.add(role_event_toxic);
                if (result) {
                    dbStats.toxics++;
                    dbStats.members.push(interaction.user.id);
                    client.db.set<SelfSacrificeStats>(`selfsacrifice_stats`, dbStats);
                    interaction.reply({
                        content: "Роль успешно выдана!",
                        ephemeral: true
                    });
                    client.logger.send(`[COMMANDS|${this.name.toUpperCase()}|${interaction.user.id}|BUTTON|${interaction.customId.toUpperCase()}] ${interaction.user.username} ${this.usage}`);
                } else {
                    interaction.reply({
                        content: "Что-то пошло не так.",
                        ephemeral: true
                    });
                    client.logger.error(`[COMMANDS|${this.name.toUpperCase()}|${interaction.user.id}|BUTTON|${interaction.customId.toUpperCase()}]`, new Error(`Не удалось выдать роль <@${interaction.user.id}> ${interaction.user.id}.`));
                }
            } else {
                interaction.reply({
                    content: "Что-то пошло не так.",
                    ephemeral: true
                });
                client.logger.error(`[COMMANDS|${this.name.toUpperCase()}|${interaction.user.id}|BUTTON|${interaction.customId.toUpperCase()}]`, new Error(`Пользователь не найден <@${interaction.user.id}> ${interaction.user.id}.`));
            }
            return true;
        }
        return false;
    }

    async onSelectMenuComponent(interaction: AnySelectMenuInteraction<CacheType>, client: Client): Promise<boolean> {
        
		let dbStats = await client.db.get<SelfSacrificeStats>(`selfsacrifice_stats`);
		if (!dbStats) {
            dbStats = { toxics: 0, kicks: 0, timouts: 0, members: [] }
            client.db.set<SelfSacrificeStats>(`selfsacrifice_stats`, dbStats);
        }

        if (interaction.customId == "select_selfsacrifice_timeout") {
            const guild = await client.guilds.fetch(main_guild);
            const member = await guild.members.fetch(interaction.user.id).catch(() => {});
            if (member) {
                try {
                    await member.timeout(evaluate(interaction.values[0]))
                    dbStats.timouts++;
                    dbStats.members.push(interaction.user.id);
                    client.db.set<SelfSacrificeStats>(`selfsacrifice_stats`, dbStats);
                    interaction.reply({
                        content: "Роль успешно выдана!",
                        ephemeral: true
                    });
                    client.logger.send(`[COMMANDS|${this.name.toUpperCase()}|${interaction.user.id}|BUTTON|${interaction.customId.toUpperCase()}] ${interaction.user.username} ${this.usage}`);
                } catch (e) {
                    interaction.reply({
                        content: "Что-то пошло не так.",
                        ephemeral: true
                    });
                    client.logger.error(`[COMMANDS|${this.name.toUpperCase()}|${interaction.user.id}|BUTTON|${interaction.customId.toUpperCase()}]`, new Error(`${e}`));
                }
            } else {
                interaction.reply({
                    content: "Что-то пошло не так.",
                    ephemeral: true
                });
                client.logger.error(`[COMMANDS|${this.name.toUpperCase()}|${interaction.user.id}|BUTTON|${interaction.customId.toUpperCase()}]`, new Error(`Пользователь не найден <@${interaction.user.id}> ${interaction.user.id}.`));
            }
            return true;
        }
        return false;
    }
}