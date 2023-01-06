import { Events, Guild } from "discord.js";
import Client from "../structures/overwrite/Client";
import { BaseEvent } from "../structures/Types";

const event: BaseEvent = {
    name: Events.GuildDelete,
    once: false,
    async execute(client: Client, guild: Guild) {
        client.logger.send(`[EVENTS|${this.name.toUpperCase()}|${guild.id}] Удаление бота с сервера.`);
    }
}

export default event;