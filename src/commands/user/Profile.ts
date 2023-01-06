import { ActionRowBuilder, AnySelectMenuInteraction, ApplicationCommandData, ApplicationCommandOptionType, ApplicationCommandType, ButtonBuilder, ButtonInteraction, ButtonStyle, CacheType, ChatInputCommandInteraction, ModalBuilder, ModalSubmitInteraction, TextInputBuilder, TextInputStyle } from "discord.js";
import fs from "fs";
import BaseCommand from "../../structures/handlers/BaseCommand";
import Client from "../../structures/overwrite/Client";
import Embed from "../../structures/overwrite/EmbedBuilder";
import { CommandType } from "../../utils/ConfigUtil";

export default class Profile extends BaseCommand {

    // Основные параметры
	name: string = "profile";
	usage: string = "Просмотр профиля на сервере";
    type: string[] = [ CommandType.SlashApplication ];
	slash: ApplicationCommandData = {
		name: this.name,
		description: this.usage,
		type: ApplicationCommandType.ChatInput,
		options: [
			{
				name: "user",
				description: "Просмотр чужого профиля",
				type: ApplicationCommandOptionType.User
			},
			{
				name: "visible",
				description: "Вывести результат в чат",
				type: ApplicationCommandOptionType.Boolean
			}
        ],
		dmPermission: true
	};
    requireClient = true;
	buttons: string[] = [ "button_profile_stats", "button_profile_info", "button_profile_top", "button_profile_config", "button_profile_my", "button_profile_bg", "button_profile_bg_delete" ];
	selects: string[] = [ "select_profile_type" ];
	modals: string[] = [ "modal_profile_bg" ];

	constructor() { super(); }

	profile_menu = [
		new ActionRowBuilder<ButtonBuilder>()
			.addComponents([
				new ButtonBuilder()
					.setCustomId('button_profile_stats')
					.setEmoji(`📈`)
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId('button_profile_info')
					.setEmoji(`ℹ️`)
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId('button_profile_top')
					.setEmoji(`🏆`)
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId('button_profile_config')
					.setEmoji(`⚙️`)
					.setStyle(ButtonStyle.Secondary)
			])
	];

    async onChatInputCommand(interaction: ChatInputCommandInteraction<CacheType>, client: Client): Promise<boolean> {
        const userOption = interaction.options.getUser("user");
		const user_id = userOption ? userOption.id : interaction.user.id;

        const visibilityOption = interaction.options.getBoolean("visible");
		const ephemeral = visibilityOption ? !visibilityOption : true;

        await interaction.deferReply({ ephemeral: ephemeral });

		let reply = await client.lvls.getProfileCard(user_id).catch((error: Error) => {
            client.logger.error(`[COMMANDS|${this.name.toUpperCase()}|${interaction.user.id}]`, error);
			interaction.followUp({
				embeds: [ new Embed(`Ошибка выполнения команды \`${this.name}\`.`) ],
				ephemeral: ephemeral
			});
        }) ?? null;

        if (reply) {
			reply.components = this.profile_menu;
			reply.ephemeral = ephemeral;
			interaction.followUp(reply);

			client.logger.send(`[COMMANDS|${this.name.toUpperCase()}|${interaction.user.id}] ${interaction.user.username} ${this.usage} - ${user_id} (${ephemeral})`);
		}
        return true;
    }

    async onButtonComponent(interaction: ButtonInteraction<CacheType>, client: Client): Promise<boolean> {
		if (interaction.customId === "button_profile_my") {
			await interaction.deferReply({ ephemeral: true });

			let reply = await client.lvls.getProfileCard(interaction.user.id).catch((error: Error) => {
				client.logger.error(`[COMMANDS|${this.name.toUpperCase()}|${interaction.user.id}|BUTTON|${interaction.customId.toUpperCase()}]`, error);
				interaction.followUp({
					embeds: [ new Embed(`Ошибка выполнения команды \`${this.name}\`.`) ],
					ephemeral: true
				});
			}) ?? null;
	
			if (reply) {
				reply.components = this.profile_menu;
				reply.ephemeral = true;
				interaction.followUp(reply);
				client.logger.send(`[COMMANDS|${this.name.toUpperCase()}|${interaction.user.id}|BUTTON|${interaction.customId.toUpperCase()}] ${interaction.user.username} ${this.usage}`);
			}
		}
		if (interaction.customId === "button_profile_stats") {
			await interaction.deferReply({ ephemeral: true });
			let user_id = interaction.user.id;

			if (interaction.message.embeds.length != 0 && interaction.message.embeds[0].description) {
				let match = interaction.message.embeds[0].description.match(/(<@)([0-9]*)(>)/);
				if (match != null) user_id = match[2];
			}

			let reply = await client.lvls.getStatsCard(user_id).catch((error: Error) => {
				client.logger.error(`[COMMANDS|${this.name.toUpperCase()}|${interaction.user.id}|BUTTON|${interaction.customId.toUpperCase()}]`, error);
				interaction.followUp({
					embeds: [ new Embed(`Ошибка выполнения команды \`${this.name}\`.`) ],
					ephemeral: true
				});
			}) ?? null;
	
			if (reply) {
				reply.ephemeral = true;
				interaction.followUp(reply);
				client.logger.send(`[COMMANDS|${this.name.toUpperCase()}|${interaction.user.id}|BUTTON|${interaction.customId.toUpperCase()}] ${interaction.user.username} ${this.usage}`);
			}
		}
		if (interaction.customId === "button_profile_info") {
			await interaction.deferReply({ ephemeral: true });
			let user_id = interaction.user.id;

			if (interaction.message.embeds.length != 0 && interaction.message.embeds[0].description) {
				let match = interaction.message.embeds[0].description.match(/(<@)([0-9]*)(>)/);
				if (match != null) user_id = match[2];
			}

			let reply = await client.lvls.getProfileInfo(user_id).catch((error: Error) => {
				client.logger.error(`[COMMANDS|${this.name.toUpperCase()}|${interaction.user.id}|BUTTON|${interaction.customId.toUpperCase()}]`, error);
				interaction.followUp({
					embeds: [ new Embed(`Ошибка выполнения команды \`${this.name}\`.`) ],
					ephemeral: true
				});
			}) ?? null;
	
			if (reply) {
				reply.ephemeral = true;
				interaction.followUp(reply);
				client.logger.send(`[COMMANDS|${this.name.toUpperCase()}|${interaction.user.id}|BUTTON|${interaction.customId.toUpperCase()}] ${interaction.user.username} ${this.usage}`);
			}
		}
		if (interaction.customId === "button_profile_top") {
			await interaction.deferReply({ ephemeral: true });
			let user_id = interaction.user.id;

			if (interaction.message.embeds.length != 0 && interaction.message.embeds[0].description) {
				let match = interaction.message.embeds[0].description.match(/(<@)([0-9]*)(>)/);
				if (match != null) user_id = match[2];
			}

			let members = await client.lvls.getTopTenUsers().catch((error: Error) => {
				client.logger.error(`[COMMANDS|${this.name.toUpperCase()}|${interaction.user.id}|BUTTON|${interaction.customId.toUpperCase()}]`, error);
				interaction.followUp({
					embeds: [ new Embed(`Ошибка выполнения команды \`${this.name}\`.`) ],
					ephemeral: true
				});
			}) ?? null;
	
			if (members) {
				members = members.map((m) => m.includes(user_id) ? `**${m}**` : m);
				interaction.followUp({
					embeds: [
						new Embed()
							.setTitle(`Топ пользователей за текущий месяц`)
							.setDescription(members.join('\n'))
					],
					ephemeral: true
				})

				client.logger.send(`[COMMANDS|${this.name.toUpperCase()}|${interaction.user.id}|BUTTON|${interaction.customId.toUpperCase()}] ${interaction.user.username} ${this.usage}`);
			}
		}
		if (interaction.customId === "button_profile_config") {
			await interaction.deferReply({ ephemeral: true });

			let reply = await client.lvls.getProfileSettings(interaction.user.id).catch((error: Error) => {
				client.logger.error(`[COMMANDS|${this.name.toUpperCase()}|${interaction.user.id}|BUTTON|${interaction.customId.toUpperCase()}]`, error);
				interaction.followUp({
					embeds: [ new Embed(`Ошибка выполнения команды \`${this.name}\`.`) ],
					ephemeral: true
				});
			}) ?? null;
	
			if (reply) {
				reply.ephemeral = true;
				interaction.followUp(reply);
				client.logger.send(`[COMMANDS|${this.name.toUpperCase()}|${interaction.user.id}|BUTTON|${interaction.customId.toUpperCase()}] ${interaction.user.username} ${this.usage}`);
			}
		}
		if (interaction.customId === "button_profile_bg") {
			const profile = await client.lvls.get(interaction.user.id);
			client.logger.send(`[COMMANDS|${this.name.toUpperCase()}|${interaction.user.id}|BUTTON|${interaction.customId.toUpperCase()}] ${interaction.user.username} вызвал смену фона профиля (${profile.lvl}).`);

			if (profile.lvl > 60) {
				interaction.reply({
					content: `Необходим 60 уровень для смены фона профиля.`,
					ephemeral: true
				});
			} else {
				interaction.showModal(
					new ModalBuilder()
						.setCustomId("modal_profile_bg")
						.setTitle("Установка фонового изображения профиля")
						.setComponents([
							new ActionRowBuilder<TextInputBuilder>()
								.addComponents([
									new TextInputBuilder()
										.setCustomId("url")
										.setLabel('Изображение будет растянуто на 400x200')
										.setPlaceholder(`http(s):// ... .png(jpg)`)
										.setStyle(TextInputStyle.Short)
										.setRequired(true)
								])
						])
				);
				
				const filter = (interaction: ModalSubmitInteraction) => interaction.customId === "modal_profile_bg";
				interaction.awaitModalSubmit({ filter, time: 120000 })
					.then(async (modalInteraction: ModalSubmitInteraction) => {
						await modalInteraction.deferReply({ ephemeral: true }).catch(() => {});
						let url = modalInteraction.fields.getTextInputValue('url');
						client.lvls.setProfileBackground(interaction.user.id, url)
							.then(async (result) => {
								if (result) {
									let reply = await client.lvls.getProfileCard(modalInteraction.user.id);
									reply.ephemeral = true;
									reply.content = `Настройки профиля успешно обновлены:`;
									modalInteraction.followUp(reply);
								} else {
									modalInteraction.followUp({
										content: `Ошибка обновления фона профиля.`,
										ephemeral: true
									});
								}
							});
					}).catch(() => {});
			}
		}
		if (interaction.customId === "button_profile_bg_delete") {
			if (fs.existsSync(`./assets/profile_backgrounds/${interaction.user.id}.png`)) {
					fs.unlinkSync(`./assets/profile_backgrounds/${interaction.user.id}.png`);
					client.lvls.getProfileCard(interaction.user.id)
						.then(async (reply) => {
							reply.ephemeral = true;
							reply.content = 'Фон профиля удален:';
							interaction.reply(reply);
							client.logger.send(`[COMMANDS|${this.name.toUpperCase()}|${interaction.user.id}|BUTTON|${interaction.customId.toUpperCase()}] ${interaction.user.username} удалил фона профиля.`);
						});
				} else {
					interaction.reply({
						content: `Фон профиля не найден.`,
						ephemeral: true
					});
				}
		}
        return true;
    }

	async onSelectMenuComponent(interaction: AnySelectMenuInteraction<CacheType>, client: Client): Promise<boolean> {
		await client.lvls.set(interaction.user.id, { profile_type: parseInt(interaction.values[0]) });
		let reply = await client.lvls.getProfileCard(interaction.user.id);
		reply.ephemeral = true;
		reply.content = `Настройки профиля успешно обновлены:`;
		interaction.reply(reply);
		client.logger.send(`[COMMANDS|${this.name.toUpperCase()}|${interaction.user.id}|BUTTON|${interaction.customId.toUpperCase()}] ${interaction.user.username} обновил тип профиля (${interaction.values[0]}).`);
		return true;
	}
}