import { ApplicationCommandData, ApplicationCommandOptionType, ApplicationCommandType, CacheType, ChatInputCommandInteraction } from "discord.js";
import { evaluate } from "mathjs";
import BaseCommand from "../../structures/handlers/BaseCommand";
import Client from "../../structures/overwrite/Client";
import Embed from "../../structures/overwrite/EmbedBuilder";
import { CommandType } from "../../utils/ConfigUtil";

export default class Math extends BaseCommand {
    
    // Основные параметры
	name: string = "math";
	usage: string = "Калькулятор";
    type: string[] = [ CommandType.SlashApplication ];
	slash: ApplicationCommandData = {
		name: this.name,
		description: this.usage,
		type: ApplicationCommandType.ChatInput,
		options: [
			{
				name: "formula",
				description: "Любое математическое уравнение",
				type: ApplicationCommandOptionType.String,
				required: true
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

	constructor() { super(); }

    async onChatInputCommand(interaction: ChatInputCommandInteraction<CacheType>, client: Client): Promise<boolean> {

        const formula = interaction.options.getString("formula") ?? `NaN`;

        const visibilityOption = interaction.options.getBoolean("visible");
		const ephemeral = visibilityOption ? !visibilityOption : true;

		let answer = "NaN";
		try {
			answer = `${evaluate(formula)}`;
		} catch (e) {
			answer = `${e}`;
		}

		if (answer.includes("function") || answer.includes("return")) answer = "NaN";

		interaction.reply({
			embeds: [ 
                new Embed()
                    .setTitle("Математическая функция")
                    .setDescription(`> ${formula}\n\`\`\`js\nРезультат: ${answer}\`\`\``)
					.setFooter({ text: `Подсмотреть допустимые выражения: https://mathjs.org/examples/index.html` })
            ],
            ephemeral: ephemeral
		});

        client.logger.send(`[COMMANDS|${this.name.toUpperCase()}|${interaction.user.id}] ${interaction.user.username} ${this.usage} \`${formula}\` - \`${answer}\``);

        return true;
    }
}