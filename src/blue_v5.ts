import { GatewayIntentBits } from "discord.js";
import Client from "./structures/overwrite/Client";

require('dotenv').config();

const client: Client = new Client({
    intents: [ 
		GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildEmojisAndStickers, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.DirectMessages
	]
});


process.on('uncaughtException', (error: Error) => client.logger.error("[INDEX|PROCESS|UNCAUGHTEXCEPTION]", error));
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => client.logger.rejection("[INDEX|PROCESS|UNHANDLEDREJECTION]", promise));

client.on('error', (error: Error) => client.logger.error("[INDEX|CLIENT|ERROR]", error));
client.on('warn', (reason: string) => client.logger.error("[INDEX|CLIENT|WARN]", new Error(reason)));

client.login(`${process.env.DISCORD_TOKEN}`)
    .then(async () => {
		client.logger.botInfo = { username: client.user.username, avatarURL: client.user.displayAvatarURL() };
		client.logger.send(`[INDEX|CLIENT] Инициализация бота`);

		// Монго
		// client.logger.send("[INDEX|CLIENT|MONGOOSE] Создание подключения к MongoDB!");
		// Mongoose.set('strictQuery', true);
		// Mongoose.connect(`${process.env.MONGODB_SERVER}`);
		// Mongoose.connection.on("connected", () => client.logger.send("[INDEX|CLIENT|MONGOOSE|CONNECTED] Успешное подключение к MongoDB!"));
		// Mongoose.connection.on("error", (error: Error) => client.logger.error(`[INDEX|CLIENT|MONGOOSE|ERROR]`, error));
		
		// Хандлеры
        (await import(`./handlers/events`))
			.default(client)
			.catch((error: Error) => client.logger.error(`[INDEX|HANDLER|EVENTS|ERROR]`, error));
        (await import(`./handlers/commands`))
			.default(client)
			.catch((error: Error) => client.logger.error(`[INDEX|HANDLER|COMMANDS|ERROR]`, error));
        // (await import(`./handlers/timeouts`)).default(client).catch((error) => client.logger.error(`[INDEX|HANDLER|TIMEOUTS|ERROR]`, error));
    })
	.catch((error: Error) => client.logger.error("[INDEX|ERROR]", error));

export default client;