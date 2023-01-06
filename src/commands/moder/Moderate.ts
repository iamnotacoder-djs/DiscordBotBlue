import { ActionRowBuilder, ApplicationCommandData, ApplicationCommandOptionType, ApplicationCommandType, CacheType, ChatInputCommandInteraction, ModalBuilder, ModalSubmitInteraction, NewsChannel, OverwriteType, PermissionFlagsBits, TextChannel, TextInputBuilder, TextInputStyle, ThreadChannel, VoiceChannel } from "discord.js";
import BaseCommand from "../../structures/handlers/BaseCommand";
import Client from "../../structures/overwrite/Client";
import Embed from "../../structures/overwrite/EmbedBuilder";
import { CommandType } from "../../utils/ConfigUtil";
import { channel_feed_orders, channel_feed_vacancies, channel_help_job, main_guild, roles_server, role_botowner_bot, role_server_admins, role_server_mods } from "../../utils/IDs";

export default class Math extends BaseCommand {
    
    // Основные параметры
	name: string = "moderate";
	usage: string = "Модерирование Не ITшников";
    type: string[] = [ CommandType.SlashApplication ];
	slash: ApplicationCommandData = {
		name: this.name,
		description: this.usage,
		type: ApplicationCommandType.ChatInput,
		options: [
			{
				name: "action",
				description: "Действие",
				type: ApplicationCommandOptionType.String,
				required: true,
				choices: [
					{
						name: "Опубликовать сообщение (по ID) в Заказах",
						value: "publish_order"
					}, 
					{
						name: "Опубликовать сообщение (по ID) в Вакансиях",
						value: "publish_vacancy"
					}, 
					{
						name: "Опубликовать оповещение о Сбросе ЛВЛ-ов",
						value: "lvls_clean_notify"
					}, 
					{
						name: "Провести Сброс ЛВЛ-ов",
						value: "lvls_clean_process"
					}, 
					{
						name: "Опубликовать в канал (по ID) Embed",
						value: "publish_embed"
					}, 
					{
						name: "Опубликовать в канал (по ID) сообщение",
						value: "publish_message"
					}
				]
			},
			{
				name: "id",
				description: "Целевое сообщение/канал/пользоватль",
				type: ApplicationCommandOptionType.String
			}
		],
		dmPermission: true,
		defaultMemberPermissions: PermissionFlagsBits.MoveMembers
	};
    requireClient = true;
	modals: string[] = [ "modal_moderate_embed", "modal_moderate_message" ];

	constructor() { super(); }

    async onChatInputCommand(interaction: ChatInputCommandInteraction<CacheType>, client: Client): Promise<boolean> {

        const action = interaction.options.getString("action") ?? "menu";
        const id = interaction.options.getString("id");

        client.logger.send(`[COMMANDS|${this.name.toUpperCase()}|${interaction.user.id}] ${interaction.user.username} ${this.usage} \`${action}\` - \`${id}\``);

		const guild = await client.guilds.fetch(main_guild);
		const member = await guild.members.fetch(interaction.user.id).catch(() => {});
		
		if (!member || !member.roles.cache.some(r => roles_server.includes(r.id))) {
			interaction.reply({ 
				content: "Что-то пошло не так.", 
				ephemeral: true
			});
			return true;
		}

		if (action == "lvls_clean_notify") {
			if (member.roles.cache.has(role_server_admins)) {
				await client.lvls.notifyAboutCleanUserStats();
				interaction.reply({ 
					content: "Готово.", 
					ephemeral: true
				});
			} else {
				interaction.reply({ 
					content: "Что-то пошло не так.", 
					ephemeral: true
				});
			}
			return true;
		}

		if (action == "lvls_clean_process") {
			if (member.roles.cache.has(role_server_admins)) {
				await client.lvls.cleanUserStats();
				interaction.reply({ 
					content: "Готово.", 
					ephemeral: true
				});
			} else {
				interaction.reply({ 
					content: "Что-то пошло не так.", 
					ephemeral: true
				});
			}
			return true;
		}

		if (action == "publish_order" || action == "publish_vacancy") {
			if (interaction.channel instanceof ThreadChannel && interaction.channel.parentId == channel_help_job) {
				if (!id) {
					interaction.reply({ 
						content: "Необходимо указать ID сообщения, которое будет репостнуто в канал" + `<#${action == "publish_order" ? channel_feed_orders : channel_feed_vacancies }>`, 
						ephemeral: true
					});
					return true;
				}
				let message = await interaction.channel.messages.fetch(id);
				const channel = await client.channels.fetch(action == "publish_order" ? channel_feed_orders : channel_feed_vacancies).catch(() => {});

				if (message && channel instanceof NewsChannel) {
					let post = await channel.send({
						content: message.content + "\n\n" + "---" + "\n" + `Автор поста: <@${message.author.id}>` + "\n" + message.url,
						files: message.attachments.map((m) => m),
						stickers: message.stickers.map((m) => m)
					});
					if (post && post.crosspostable) post.crosspost().catch(() => {});

					interaction.reply({ 
						content: "Готово.", 
						ephemeral: true
					});

					channel.permissionOverwrites.set([
						{
							id: main_guild,
							type: OverwriteType.Role,
							allow: [ PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory ],
							deny: [ PermissionFlagsBits.UseApplicationCommands, PermissionFlagsBits.SendMessages ]
						},
						{
							id: role_server_mods,
							type: OverwriteType.Role,
							allow: [ PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ManageMessages ]
						},
						{
							id: role_server_admins,
							type: OverwriteType.Role,
							allow: [ PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ManageMessages ]
						},
						{
							id: role_botowner_bot,
							type: OverwriteType.Role,
							deny: [ PermissionFlagsBits.ViewChannel ]
						}
					]);
				} else {
					interaction.reply({ 
						content: "Сообщение или канал не найдены.", 
						ephemeral: true
					});
				}
			} else {
				interaction.reply({ 
					content: "Команду можно вызвать только в тредах канала: " + `<#${channel_help_job}>`, 
					ephemeral: true
				});
			}
			return true;
		}

		if (action == "publish_embed") {
			if (!id) {
				interaction.reply({ 
					content: "Необходимо указать ID канала, куда будем отправлять Embed.", 
					ephemeral: true
				});
				return true;
			}
			const channel = await client.channels.fetch(id).catch(() => {});
			if (!(channel instanceof NewsChannel || channel instanceof ThreadChannel || channel instanceof TextChannel || channel instanceof VoiceChannel)) {
				interaction.reply({ 
					content: "Необходимо указать ID канала, куда будем отправлять Embed.", 
					ephemeral: true
				});
				return true;
			}

			
			interaction.showModal(
				new ModalBuilder()
					.setCustomId("modal_moderate_embed")
					.setTitle("Публикация Embed'а")
					.setComponents([
						new ActionRowBuilder<TextInputBuilder>().addComponents([
							new TextInputBuilder()
								.setCustomId("title")
								.setLabel("Заголовок")
								.setPlaceholder("Заголовок")
								.setStyle(TextInputStyle.Short)
								.setMinLength(1)
								.setRequired(true)
						]),
						new ActionRowBuilder<TextInputBuilder>().addComponents([
							new TextInputBuilder()
								.setCustomId("url")
								.setLabel("Ссылка для заголовка")
								.setPlaceholder("Ссылка для заголовка")
								.setStyle(TextInputStyle.Short)
						]),
						new ActionRowBuilder<TextInputBuilder>().addComponents([
							new TextInputBuilder()
								.setCustomId("description")
								.setLabel("Описание")
								.setPlaceholder("Описание")
								.setMinLength(1)
								.setMaxLength(4000)
								.setStyle(TextInputStyle.Paragraph)
								.setRequired(true)
						]),
						new ActionRowBuilder<TextInputBuilder>().addComponents([
							new TextInputBuilder()
								.setCustomId("imageurl")
								.setLabel("Ссылка на изображение")
								.setPlaceholder("http(s):// ... .png(jpg)")
								.setStyle(TextInputStyle.Short)
						])					  
					])
			);
			
			const filter = (interaction: ModalSubmitInteraction) => interaction.customId === "modal_moderate_embed";
			interaction.awaitModalSubmit({ filter, time: 120000 })
				.then(async (modalInteraction: ModalSubmitInteraction) => {
					modalInteraction.deferUpdate().catch(() => {});

					const title = modalInteraction.fields.getTextInputValue("title");
					const url = modalInteraction.fields.getTextInputValue("url").trim();
					const description = modalInteraction.fields.getTextInputValue("description");
					const imageurl = modalInteraction.fields.getTextInputValue("imageurl").trim();

					channel.send({
						embeds: [
							new Embed()
								.setTitle(title)
								.setURL(url.length == 0 ? null : url)
								.setDescription(description)
								.setImage(imageurl.length == 0 ? null : imageurl)
						]
					});
					
				}).catch(() => {});

			return true;
		}

		if (action == "publish_message") {
			if (!id) {
				interaction.reply({ 
					content: "Необходимо указать ID канала, куда будем отправлять сообщение.", 
					ephemeral: true
				});
				return true;
			}
			const channel = await client.channels.fetch(id).catch(() => {});
			if (!(channel instanceof NewsChannel || channel instanceof ThreadChannel || channel instanceof TextChannel || channel instanceof VoiceChannel)) {
				interaction.reply({ 
					content: "Необходимо указать ID канала, куда будем отправлять сообщение.", 
					ephemeral: true
				});
				return true;
			}
			
			interaction.showModal(
				new ModalBuilder()
					.setCustomId("modal_moderate_message")
					.setTitle("Публикация сообщения")
					.setComponents([
						new ActionRowBuilder<TextInputBuilder>()
							.addComponents([
								new TextInputBuilder()
									.setCustomId("text")
									.setLabel("Текст")
									.setPlaceholder("Текст")
									.setMinLength(1)
									.setMaxLength(2000)
									.setStyle(TextInputStyle.Paragraph)
									.setRequired(true)
							])
					])
			);
			
			const filter = (interaction: ModalSubmitInteraction) => interaction.customId === "modal_moderate_message";
			interaction.awaitModalSubmit({ filter, time: 120000 })
				.then(async (modalInteraction: ModalSubmitInteraction) => {
					modalInteraction.deferUpdate().catch(() => {});

					const text = modalInteraction.fields.getTextInputValue("text");
					channel.send({ content: text });
					
				}).catch(() => {});

			return true;
		}

        return false;
    }
}