import { lstat, readdir } from 'fs/promises';
import { join } from 'path';

import Client from "../structures/overwrite/Client";
import { BaseEvent } from '../structures/Types';

async function init(client: Client): Promise<void> {
    client.logger.send(`[HANDLER|EVENTS] Хандлер событий запущен.`);
    await walk(client, './dist/events/');
}

async function walk(client: Client, dir: string): Promise<void> {
    if (Array.isArray(dir)) return;

    if ( !(await lstat(dir)).isDirectory() ) {
        const event: BaseEvent = (await import(`../${dir}`.replace('/dist', '')))?.default;
        
        client.removeAllListeners(event.name);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(client, ...args).catch((error: Error) => client.logger.error(`[HANDLER|EVENTS|ONCE|ERROR`, error)));
        } else {
            client.on(event.name, (...args) => event.execute(client, ...args).catch((error: Error) => client.logger.error(`[HANDLER|EVENTS|ON|ERROR`, error)));
        }
        client.logger.send(`[HANDLER|EVENTS|${event.once ? "ONCE" : "ON"}] Слушатель "${event.name}" загружен.`);

        return;
    }

    for(let file of (await readdir(dir))) {
        await walk(client, join(dir, file));
    }

    return;
}

export default init;