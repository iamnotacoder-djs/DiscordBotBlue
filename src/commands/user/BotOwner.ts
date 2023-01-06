import { ActionRowBuilder, ApplicationCommandData, ApplicationCommandType, ButtonInteraction, CacheType, ChatInputCommandInteraction, ModalBuilder, ModalSubmitInteraction, TextInputBuilder, TextInputStyle, ThreadChannel } from "discord.js";
import BaseCommand from "../../structures/handlers/BaseCommand";
import Client from "../../structures/overwrite/Client";
import Embed from "../../structures/overwrite/EmbedBuilder";
import { BotOwnerRequest } from "../../structures/Types";
import { CommandType } from "../../utils/ConfigUtil";
import { main_guild, role_server_admins } from "../../utils/IDs";

export default class BotOwner extends BaseCommand {
    

    // Основные параметры
	name: string = "botowner";
	usage: string = "Пригласить своего бота на сервер [LVL: 20]";
    type: string[] = [ CommandType.SlashApplication ];
	slash: ApplicationCommandData = {
		name: this.name,
		description: this.usage,
		type: ApplicationCommandType.ChatInput,
		options: [],
		dmPermission: true
	};
    requireClient = true;
	buttons: string[] = [ "button_botowners_invite", "button_botowners_kick" ];
	modals: string[] = [ "modal_botowners_invite" ];

	constructor() { super(); }

	inviteModal = new ModalBuilder()
		.setCustomId("modal_botowners_invite")
		.setTitle("Пригласить своего бота на сервер")
		.setComponents([
			new ActionRowBuilder<TextInputBuilder>()
				.addComponents(
					new TextInputBuilder()
						.setCustomId("name")
						.setLabel("Название бота")
						.setStyle(TextInputStyle.Short)
						.setMinLength(3)
						.setMaxLength(60)
						.setPlaceholder("RoomCreator")
						.setRequired(true)
				), 
			new ActionRowBuilder<TextInputBuilder>()
				.addComponents(
					new TextInputBuilder()
						.setCustomId("client_id")
						.setLabel("client_id")
						.setStyle(TextInputStyle.Short)
						.setMinLength(16)
						.setMaxLength(20)
						.setPlaceholder("894811786434469908")
						.setRequired(true)
				),
			new ActionRowBuilder<TextInputBuilder>()
				.addComponents(
					new TextInputBuilder()
						.setCustomId("description")
						.setLabel("Описание")
						.setStyle(TextInputStyle.Paragraph)
						.setMinLength(3)
						.setMaxLength(300)
						.setPlaceholder("Создание голосовых чатов, которые автоматические удаляются.")
						.setRequired(true)
				), 
			new ActionRowBuilder<TextInputBuilder>()
				.addComponents(
					new TextInputBuilder()
						.setCustomId("command")
						.setLabel("Cписок команд бота")
						.setStyle(TextInputStyle.Short)
						.setMinLength(3)
						.setMaxLength(60)
						.setPlaceholder("/commands")
						.setRequired(true)
				)
		]);

    async onChatInputCommand(interaction: ChatInputCommandInteraction<CacheType>, client: Client): Promise<boolean> {

        client.logger.send(`[COMMANDS|${this.name.toUpperCase()}|${interaction.user.id}] ${interaction.user.username} ${this.usage}`);

		const profile = await client.lvls.get(interaction.user.id);
		if (profile.lvl < 20) {
			interaction.reply({
				content: "Для доступа к команде необходим 20 уровень на сервере." + "\n" +
						 `У тебя - ${profile.lvl}.`,
				ephemeral: true
			});
			return true;
		}
		if ((await client.lvls.get(interaction.user.id)).invited_bot != 'undefined') {
			interaction.reply({ 
				content: "На сервере уже есть 1 твой бот. Сначала кикни его, чтобы пригласить нового.\nЭто можно сделать в настройках профиля.", 
				ephemeral: true
			});
			return true;
		}

		interaction.showModal(this.inviteModal);
		const filter = (interaction: ModalSubmitInteraction) => interaction.customId === "modal_botowners_invite";
		interaction.awaitModalSubmit({ filter, time: 120000 })
			.then((interaction) => this.onModalFormComplete(interaction, client)).catch(() => {});

        return true;
    }

	async onButtonComponent(interaction: ButtonInteraction<CacheType>, client: Client): Promise<boolean> {
		if (interaction.customId == "button_botowners_invite") {

			client.logger.send(`[COMMANDS|${this.name.toUpperCase()}|${interaction.user.id}|BUTTON|${interaction.customId.toUpperCase()}] ${interaction.user.username} ${this.usage}`);
	
			const profile = await client.lvls.get(interaction.user.id);
			if (profile.lvl < 20) {
				interaction.reply({
					content: "Для доступа к команде необходим 20 уровень на сервере." + "\n" +
							 `У тебя - ${profile.lvl}.`,
					ephemeral: true
				});
				return true;
			}
			if ((await client.lvls.get(interaction.user.id)).invited_bot != 'undefined') {
				interaction.reply({ 
					content: "На сервере уже есть 1 твой бот. Сначала кикни его, чтобы пригласить нового.\nЭто можно сделать в настройках профиля.", 
					ephemeral: true
				});
				return true;
			}

			interaction.showModal(this.inviteModal);
			const filter = (interaction: ModalSubmitInteraction) => interaction.customId === "modal_botowners_invite";
			interaction.awaitModalSubmit({ filter, time: 120000 })
				.then((interaction) => this.onModalFormComplete(interaction, client)).catch(() => {});
			return true;
		}
		if (interaction.customId == "button_botowners_kick") {
			const profile = await client.lvls.get(interaction.user.id);

			client.logger.send(`[COMMANDS|${this.name.toUpperCase()}|${interaction.user.id}|BUTTON|${interaction.customId.toUpperCase()}] ${interaction.user.username} ${this.usage} - <@${profile.invited_bot}> (${profile.invited_bot})`);

			const guild = await client.guilds.fetch(main_guild);
			const member = await guild.members.fetch(profile.invited_bot).catch(() => {});
			if (member) {
				const result = await member.kick();
				if (result) {
					interaction.reply({ 
						content: "Бот успешно кикнут с сервера.", 
						ephemeral: true
					});
					client.lvls.set(interaction.user.id, { invited_bot: "undefined" });
				} else {
					interaction.reply({ 
						content: "Что-то пошло не так.", 
						ephemeral: true
					});
				}
			} else {
				interaction.reply({ 
					content: "На данный момент на сервере нет приглашенных тобой ботов.", 
					ephemeral: true
				});
				client.lvls.set(interaction.user.id, { invited_bot: "undefined" });
			}
			return true;
		}
		return false;
	}

	async onModalFormComplete(interaction: ModalSubmitInteraction, client: Client) {
		const 	name = interaction.fields.getTextInputValue("name"), 
				client_id = interaction.fields.getTextInputValue("client_id"),
				description = interaction.fields.getTextInputValue("description"),
				command = interaction.fields.getTextInputValue("command");

		if (!/^\d+$/.test(client_id)) {
			return interaction.reply({ 
				content: `**client_id** (\`${client_id}\`) может содержать только числа. Попробуй снова.`, 
				ephemeral: true
			});
		}

		const guild = await interaction.client.guilds.fetch(main_guild);
		
		const botMember = await guild.members.fetch(client_id).catch(() => {});
		if (botMember) return interaction.reply({ 
			content: "Бот уже на сервере.", 
			ephemeral: true
		});

		const channel_id = await client.db.get<string>("mods_thread_botowners");
		if (channel_id) {
			const channel = await client.channels.fetch(channel_id);
			if (channel instanceof ThreadChannel) {
				if (channel.archived) await channel.setArchived(false);
				const message = await channel.send({
					content: `<@&${role_server_admins}>`,
					embeds: [
						new Embed()
							.setTitle("Добавление бота на сервер")
							.setURL(`https://discordapp.com/oauth2/authorize?client_id=${client_id.trim()}&scope=bot&permissions=0`)
							.setDescription(`Пригласил: <@${interaction.user.id}>\nБот: <@${client_id.trim()}>\n\n\`\`\`json\n{\n "client_id": "${client_id}",\n "name": "${name}",\n "description": "${description}",\n "command": "${command}"\n}\`\`\``)
					]
				});
				client.db.set<BotOwnerRequest>(`botowner_b${client_id}`, {
					client_id: client_id,
					name: name,
					description: description,
					command: command,
					admin_msg: message.id,
					owner_id: interaction.user.id
				});
				return interaction.reply({ 
					content: "Заявка отправлена. Вскоре бот будет добавлен на сервер.", 
					ephemeral: true
				});
			}
		}
		interaction.reply({ 
			content: "Что-то пошло не так.", 
			ephemeral: true
		});
	}
}