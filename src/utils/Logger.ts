import { WebhookClient } from "discord.js";
import { LoggerBotInfo } from "../structures/Types";

export default class Logger {

    webhookClient: WebhookClient = new WebhookClient({ url: `${process.env.LOGS_WEBHOOK}` });
    botInfo: LoggerBotInfo;

	/**
	 * Создает экземпляр Logger
	 */
    constructor() {
        this.botInfo = {
            avatarURL: "",
            username: "Синий"
        }
        this.send(`[LOGGER|CONSTRUCTOR|WEBHOOK] Подключение к вебхуку: ||${process.env.LOGS_WEBHOOK}||`);
    }

    /**
     * @param  {string} message [КЛАСС|МЕТОД|ДЕЙСТВИЕ] Текст сообщения
     */
    send(message: string): void
    send(message: string = "[LOGGER|SEND|NULLPOINTED]") {
        this.#submit(message);
    }

    /**
     * @param  {string} message [КЛАСС|МЕТОД|ДЕЙСТВИЕ]
     * @param  {Error} error Ошибка
     */
    error(message: string, error: Error): void
    error(message: string = "[LOGGER|ERROR|NULLPOINTED]", error: Error = new Error()) {
        this.#submit(`${message}\n@everyone\n**${error.name} ${error.message}**\n${"```"}js\n${error?.stack}${"```"}`, true);
    }

	/**
     * @param  {string} message [КЛАСС|МЕТОД|ДЕЙСТВИЕ]
     * @param  {unknown} error Ошибка
	 * @returns void
	 */
    rejection(message: string, promise?: Promise<any>): void
	rejection(message: string = "[LOGGER|REJECTION|NULLPOINTED]", promise: Promise<any>): void {
        promise.catch((error: Error) => {
            this.error(message, error)
        });
	}
    
    /**
     * @param  {string} message Текст сообщения
     * @param  {boolean} allowedMentions Разрешить пинг @everyone
     */
    #submit(message: string, allowedMentions: boolean = false) {
        console.log(message);
        this.webhookClient.send({ content: message, allowedMentions: allowedMentions ? { parse: [ 'everyone' ] } : { users: [] }, username: this.botInfo.username, avatarURL: this.botInfo.avatarURL }).catch((error: Error) => console.error("[LOGGER|SUBMIT|ERROR]", error));

        while(message.match(/\|\|([^)]+)\|\|/)) {
            message = message.replace(`${message.match(/\|\|([^)]+)\|\|/)![0]}`, "█".repeat(message.match(/\|\|([^)]+)\|\|/)![0].length).substring(0, 10));
        } 
    }
}