import { AttachmentBuilder, Message } from "discord.js";
import BaseCommand from "../../structures/handlers/BaseCommand";
import Client from "../../structures/overwrite/Client";
import { CommandType } from "../../utils/ConfigUtil";
import { owner_id } from "../../utils/IDs";

export default class Eval extends BaseCommand {

    // Основные параметры
    name: string = "eval";
    usage: string = "eval";
    type: string[] = [ CommandType.Message ];
    requireClient: boolean = true;

	constructor() { super(); }

    async onMessageCreate(message: Message<boolean>, client: Client): Promise<void> {
		if (message.author.id == owner_id) {
			const args: string[] = message.content.slice(5).trim().split(" ");
			const code: string = args.join(" ");

			try {
				const evaled: string = args.includes("await") ? eval(`(async () => { ${code} })()`) : eval(code); 
                const cleaned: string = await this.clean(evaled);
				const text: string = cleaned.length > 2000 ? "Текст содержит более 2k символов." : cleaned;
				const file: AttachmentBuilder[] = cleaned.length > 2000 ? [ new AttachmentBuilder(Buffer.from(`${cleaned}`), { name: "code.js" }) ] : [];

				await message.reply({ content: `\`\`\`js\n${text}\n\`\`\``, files: file });
				client.logger.send(`[COMMANDS|${this.name.toUpperCase()}|${message.author.id}] \`\`\`js\n${message.content}\`\`\`\`\`\`js\n${text}\`\`\``);
			} catch (error) {
				message.channel.send({ content: `\`ERROR\`\n\`\`\`x1\n${error}\n\`\`\`` });

				client.logger.send(`[COMMANDS|${this.name.toUpperCase()}|${message.author.id}] \`\`\`js\n${message.content}\`\`\`\`\`\`x1\n${error}\`\`\``);
			}
			return;
		}
		client.logger.send(`[COMMANDS|${this.name.toUpperCase()}|${message.author.id}] ${message.author.username} ${this.usage}`);
    }

    async clean(code: string): Promise<string>
	async clean(code: string): Promise<string> {
		if (code && code.constructor.name == "Promise")
			code = await code;
		if (typeof code !== "string")
			code = require("util").inspect(code, { depth: 0 });
		code = code.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203)).replace(`${process.env.TOKEN}`, `${process.env.TOKEN}`.split('').sort(() => { return 0.5 - Math.random(); }).join(''));
		return code;
	}
}