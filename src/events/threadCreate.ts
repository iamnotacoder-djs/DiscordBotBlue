import { Events, ThreadChannel } from "discord.js";
import Client from "../structures/overwrite/Client";
import { BaseEvent } from "../structures/Types";
import { channel_help_ask } from "../utils/IDs";

const event: BaseEvent = {
    name: Events.ThreadCreate,
    once: false,
    async execute(client: Client, thread: ThreadChannel) {
        if (thread.parentId == channel_help_ask) {
            thread.send({
                content:    "• Избегаем мета-вопросов" + "\n" +
                            "• Если вопрос касается непосредственно твоего кода:" + "\n" +
                            "> Опубликой полный вывод ошибки с терминала," + "\n" +
                            "> Фрагмент кода, на который эта ошибка ссылается! " + "\n" +
                            "• Объясни как можно подробней свою проблему."
            });
        }
    }
}

export default event;