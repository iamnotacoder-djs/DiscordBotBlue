import { Events, ThreadChannel } from "discord.js";
import Client from "../structures/overwrite/Client";
import { BaseEvent } from "../structures/Types";
import { channel_about, channel_mods } from "../utils/IDs";

const event: BaseEvent = {
    name: Events.ThreadUpdate,
    once: false,
    async execute(client: Client, oldThread: ThreadChannel, newThread: ThreadChannel) {
        if (newThread.parentId == channel_about) {
            if (!oldThread.archived && newThread.archived) {
                newThread.setArchived(false);
                client.logger.send(`[EVENTS|${this.name.toUpperCase()}] Тред ${newThread.name} (${newThread.id}) возобновлен.`);
            }
        }
        if (newThread.parentId == channel_mods) {
            if (!oldThread.archived && newThread.archived) {
                const channel_ids = [
                    await client.db.get<string>(`mods_thread_messages`),
                    await client.db.get<string>(`mods_thread_roomcreator`),
                    await client.db.get<string>("mods_thread_botowners")
                ];
                if (channel_ids.includes(newThread.id)) {
                    newThread.setArchived(false);
                    client.logger.send(`[EVENTS|${this.name.toUpperCase()}] Тред ${newThread.name} (${newThread.id}) возобновлен.`);
                }
            }
        }
    }
}

export default event;