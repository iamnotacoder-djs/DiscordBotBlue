import { ApplicationCommandDataResolvable } from 'discord.js';
import { lstat, readdir } from 'fs/promises';
import { join } from 'path';
import BaseCommand from '../structures/handlers/BaseCommand';

import Client from '../structures/overwrite/Client';
import { CommandType } from '../utils/ConfigUtil';

async function init(client: Client): Promise<void> {
    client.logger.send(`[HANDLER|COMMANDS] Хандлер Slash-комманд запущен.`);

    const slashes: ApplicationCommandDataResolvable[] | void = await walk(client, './dist/commands/').catch((error: Error) => client.logger.error(`[HANDLER|COMMANDS|ERROR]`, error));

    if (!Array.isArray(slashes) || !client.application) return;

    client.application.commands.set(slashes)
        .then(() => {
            client.logger.send(`[HANDLER|COMMANDS] Установлено ${slashes.length} глобальных slash-комманд.`);
        })
        .catch((error: Error) => {
            client.logger.send(`${error.name} \n ${error.cause} \n ${error.message} \n ${error.stack} \n `);
            client.logger.error(`[HANDLER|COMMANDS] Ошибка установки глобальных slash-комманд.`, error);
        });

    client.logger.send(`[HANDLER|COMMANDS] Загружено ${client.commands.size} комманд.`);
}

async function walk(client: Client, dir: string, slashes: ApplicationCommandDataResolvable[] = []): Promise<ApplicationCommandDataResolvable[]> {
    if (Array.isArray(dir)) return slashes;
    
    if ( !(await lstat(dir)).isDirectory() ) {
        const command: BaseCommand = new ((await import(`../${dir}`.replace('/dist', '')))?.default);

        client.commands.set(command.name, command);

        if (command.type.includes(CommandType.SlashApplication)) slashes.push(command.slash);

        return slashes;
    }

    for(let file of (await readdir(dir))) {
        await walk(client, join(dir, file), slashes);
    }
    
    return slashes;
}

export default init;