import { Events, MessageReaction, User } from "discord.js";
import Client from "../structures/overwrite/Client";
import { BaseEvent } from "../structures/Types";

const event: BaseEvent = {
    name: Events.MessageReactionAdd,
    once: false,
    async execute(client: Client, messageReaction: MessageReaction, user: User) {
        if (messageReaction.message.inGuild()) client.lvls.add(user.id, { reactions: 1 });
    }
}

export default event;
