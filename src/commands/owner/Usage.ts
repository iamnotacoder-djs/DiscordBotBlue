import { Message } from "discord.js";
import BaseCommand from "../../structures/handlers/BaseCommand";
import Client from "../../structures/overwrite/Client";
import { CommandType } from "../../utils/ConfigUtil";
import { owner_id } from "../../utils/IDs";

export default class Usage extends BaseCommand {

    // Основные параметры
    name: string = "usage";
    usage: string = "ram usage";
    type: string[] = [ CommandType.Message ];
    requireClient: boolean = true;

	constructor() { super(); }

    formatMemoryUsage = (data: number): string => `${Math.round(data / 1024 / 1024 * 100) / 100} MB`;

    async onMessageCreate(message: Message<boolean>, client: Client): Promise<void> {
		if (message.author.id == owner_id) {
            client.db.set("project_memory_usage", Date.now());
            const memoryData = process.memoryUsage();

            const memoryUsage = {
                rss: `${this.formatMemoryUsage(memoryData.rss)} -> Resident Set Size - total memory allocated for the process execution`,
                heapTotal: `${this.formatMemoryUsage(memoryData.heapTotal)} -> total size of the allocated heap`,
                heapUsed: `${this.formatMemoryUsage(memoryData.heapUsed)} -> actual memory used during the execution`,
                external: `${this.formatMemoryUsage(memoryData.external)} -> V8 external memory`,
            };

            message.reply({
                content: `${"```"}json\n${JSON.stringify(memoryUsage, null, 4)}${"```"}`
            })

            client.logger.send(`${"```"}json\n${JSON.stringify(memoryUsage, null, 4)}${"```"}`);
            client.logger.send(`[COMMANDS|${this.name.toUpperCase()}|${message.author.id}] ${"```"}json\n${JSON.stringify(memoryUsage, null, 4)}${"```"}`);
            return;
		}
		client.logger.send(`[COMMANDS|${this.name.toUpperCase()}|${message.author.id}] ${message.author.username} ${this.usage}`);
    }
}