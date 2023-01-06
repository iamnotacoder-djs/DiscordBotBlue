import { AnySelectMenuInteraction, ApplicationCommandData, ApplicationCommandOptionChoiceData, ApplicationCommandOptionType, ApplicationCommandType, AutocompleteInteraction, CacheType, ChatInputCommandInteraction } from "discord.js";
import BaseCommand from "../../structures/handlers/BaseCommand";
import Client from "../../structures/overwrite/Client";
import { CommandType } from "../../utils/ConfigUtil";
import { main_guild, roles_colors } from "../../utils/IDs";

export default class Math extends BaseCommand {
    
    // Основные параметры
	name: string = "color";
	usage: string = "Получить цветную роль [LVL: 50]";
    type: string[] = [ CommandType.SlashApplication ];
	slash: ApplicationCommandData = {
		name: this.name,
		description: this.usage,
		type: ApplicationCommandType.ChatInput,
		options: [
			{
				name: "role",
				description: "Выбери роль",
				type: ApplicationCommandOptionType.String,
				autocomplete: true,
				required: true
			}
		],
		dmPermission: true
	};
    requireClient = true;
	selects: string[] = [ "select_color_roles" ];

	constructor() { super(); }

	async onAutocomplete(interaction: AutocompleteInteraction<CacheType>, client: Client): Promise<boolean> {
		const guild = await client.guilds.fetch(main_guild).catch(() => {});
		if (!guild) {
			interaction.respond([]);
			return true;
		}
		const focusedOption = interaction.options.getFocused(true);
		let options: ApplicationCommandOptionChoiceData[] = [];
		guild.roles.fetch().catch(() => {});
		
        for(let role_id of roles_colors) {
            const role = guild.roles.cache.get(role_id);
            if (role) options.push({
                name: `${role.name} (ID: ${role.id})`.substring(0, 100),
                value: role_id
            });
        }

		options = options.map((entry) => {
			let points = 0;

			if (entry.name.toLowerCase() == focusedOption.value) {
				points += 100;
			}
		
			if (entry.name.toLowerCase().startsWith(focusedOption.value)) {
				points += 20;
			}
		
			if (`${entry.value}`.toLowerCase().startsWith(focusedOption.value)) {
				points += 10;
			}
		
			if (entry.name.toLowerCase().includes(` ${focusedOption.value}`)) {
				points += 2;
			}
		
			if (`${entry.value}`.toLowerCase().includes(` ${focusedOption.value}`)) {
				points += 1;
			}
		
			return {...entry, points};
		})
		.filter((a) => a.points != 0) // Отсекаем статьи без совпадений
		.sort((a, b) => b.points - a.points) // Сортируем
		.map((m) => ({ name: m.name.substring(0, 100), value: m.value })) // Готовим Respond
		.slice(0, 25); // Отсекаем лишние опции

		options.push({
			name: "Снять роль",
			value: "delete_role"
		});

		interaction.respond(options.slice(0, 25));
		return true;
	}

    async onChatInputCommand(interaction: ChatInputCommandInteraction<CacheType>, client: Client): Promise<boolean> {

        const role_id = interaction.options.getString("role");

		const guild = await client.guilds.fetch(main_guild);
		const member = await guild.members.fetch(interaction.user.id).catch(() => {});
		if (!member) {
			interaction.reply({ 
				content: "Что-то пошло не так.", 
				ephemeral: true
			});
			return true;
		}

		if (role_id == "delete_role") {
			const roles = member.roles.cache.filter(r => roles_colors.includes(r.id));
			member.roles.remove(roles).catch(() => {});
			interaction.reply({ 
				content: "Роли обновлены.", 
				ephemeral: true
			});
			client.logger.send(`[COMMANDS|${this.name.toUpperCase()}|${interaction.user.id}] ${interaction.user.username} ${this.usage} удаление ролей ${roles}`);
			return true;
		}

		const profile = await client.lvls.get(interaction.user.id);
		if (profile.lvl < 50) {
			interaction.reply({
				content: "Для доступа к команде необходим 50 уровень на сервере." + "\n" + 
						 `У тебя - ${profile.lvl}.`,
				ephemeral: true
			});

			client.logger.send(`[COMMANDS|${this.name.toUpperCase()}|${interaction.user.id}] ${interaction.user.username} ${this.usage} (${profile.lvl})`);

			return true;
		}

		const roles = member.roles.cache.filter(r => roles_colors.includes(r.id));
		await member.roles.remove(roles).catch(() => {});

		member.roles.add(role_id!).catch(() => {});

		interaction.reply({ 
			content: "Роли обновлены.", 
			ephemeral: true
		});

		client.logger.send(`[COMMANDS|${this.name.toUpperCase()}|${interaction.user.id}] ${interaction.user.username} ${this.usage} - ${role_id}`);

        return true;
    }

	async onSelectMenuComponent(interaction: AnySelectMenuInteraction<CacheType>, client: Client): Promise<boolean> {
		
        const role_id = interaction.values;

		const guild = await client.guilds.fetch(main_guild);
		const member = await guild.members.fetch(interaction.user.id).catch(() => {});
		if (!member) {
			interaction.reply({ 
				content: "Что-то пошло не так.", 
				ephemeral: true
			});
			return true;
		}

		if (role_id.length == 0) {
			const roles = member.roles.cache.filter(r => roles_colors.includes(r.id));
			await member.roles.remove(roles).catch(() => {});
			interaction.reply({ 
				content: "Роли обновлены.", 
				ephemeral: true
			});
			client.logger.send(`[COMMANDS|${this.name.toUpperCase()}|${interaction.user.id}|SELECT|${interaction.customId.toUpperCase()}] ${interaction.user.username} ${this.usage} удаление ролей ${roles}`);
			return true;
		}

		const profile = await client.lvls.get(interaction.user.id);
		if (profile.lvl < 50) {
			interaction.reply({
				content: "Для доступа к команде необходим 50 уровень на сервере." + "\n" + 
						 `У тебя - ${profile.lvl}.`,
				ephemeral: true
			});

			client.logger.send(`[COMMANDS|${this.name.toUpperCase()}|${interaction.user.id}|SELECT|${interaction.customId.toUpperCase()}] ${interaction.user.username} ${this.usage} (${profile.lvl})`);

			return true;
		}

		const roles = member.roles.cache.filter(r => roles_colors.includes(r.id));
		await member.roles.remove(roles).catch(() => {});

		member.roles.add(role_id).catch(() => {});

		interaction.reply({ 
			content: "Роли обновлены.", 
			ephemeral: true
		});

		client.logger.send(`[COMMANDS|${this.name.toUpperCase()}|${interaction.user.id}|SELECT|${interaction.customId.toUpperCase()}] ${interaction.user.username} ${this.usage} - ${role_id}`);

		return true;
	}
}