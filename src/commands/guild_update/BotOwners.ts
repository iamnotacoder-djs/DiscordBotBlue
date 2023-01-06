import { ActionRowBuilder, ApplicationCommand, ApplicationCommandData, ApplicationCommandType, ButtonBuilder, ButtonStyle, CacheType, Channel, ChatInputCommandInteraction, PermissionFlagsBits, TextChannel } from "discord.js";
import BaseCommand from "../../structures/handlers/BaseCommand";
import Client from "../../structures/overwrite/Client";
import { CommandType, deferReply, _replyNullChannel, _replyNullGuild } from "../../utils/ConfigUtil";
import { channel_botowners_about } from "../../utils/IDs";

export default class BotOwners extends BaseCommand {

    // Основные параметры
	name: string = "botowners";
	usage: string = "Заполнить канал О-ботоводах";
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
		
        const channel: Channel | TextChannel | null = await client.channels.fetch(channel_botowners_about) ?? null;
        if (!(channel instanceof TextChannel)) return _replyNullChannel(interaction);

		const cmd = client.application.commands.cache.find((c: ApplicationCommand) => c.name === 'botowner');
		channel.send({
			content: "Опытные пользователи этого сервера с уровнем 30 и выше, могут пригласить своего бота на Не ITшники: Хвастаться, рекламировать и тестить свои команды здесь." + `\n${cmd ? `</${cmd.name}:${cmd.id}>` : "`/botowner`" }` + "\n\n" + "**Стоит соблюдать пару правил:**" + "\n\n" + "> Приглашать можно только своих ботов. Если увижу бота на лям серверов - устрою допрос." + "\n\n" + "> Добавить бота - это значит взять полную ответственность за его действия. Нарушение правил сообщества Discord, условий использования Discord или правил сервера приведет к блокировке аккаунта." + "\n\n" + "> Частое переприглашение ботов под запретом. Просьбы: кикни этого бота и пригласи другого - мы не терпим." + "\n\n" + "> Бот может быть автоматически выгнан с сервера после 45 (иногда 30) дней инактивности. Под активностью считаются: отправка сообщений / вход в голосовой чат." + "\n\n" + "> Бот может быть изгнан с сервера за многочисленные жалобы на спам." + "\n\n" + "> Нужны особые права для бота? Обращайся к модераторам.",
			components: [
				new ActionRowBuilder<ButtonBuilder>()
					.addComponents([
						new ButtonBuilder()
							.setCustomId("button_botowners_invite")
							.setLabel("Пригласить бота")
							.setStyle(ButtonStyle.Primary)
					])
			]
		});

		channel.guild.setRulesChannel(channel).catch(() => {});

        return deferReply(interaction);
    }
}