import { Client as OClient, ClientOptions, Collection } from "discord.js";
import { QuickDB } from "quick.db";
import CronActions from "../../utils/CronActions";
import LevelSystem from "../../utils/LevelSystem";

// Utils
import Logger from "../../utils/Logger";
import BaseCommand from "../handlers/BaseCommand";
// import Timeout from "./Timeout";

export default class Client extends OClient<true> {

    readonly db: QuickDB = new QuickDB();
    
    // Utils
    
    readonly logger: Logger = new Logger();
    readonly lvls: LevelSystem = new LevelSystem(this);
    readonly cron: CronActions = new CronActions();
    
    readonly commands: Collection<string, BaseCommand> = new Collection();

    constructor(data: ClientOptions) {
        super(data);
    };
}