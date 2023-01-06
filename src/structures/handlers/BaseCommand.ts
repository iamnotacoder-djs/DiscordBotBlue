import { AnySelectMenuInteraction, ApplicationCommandData, ApplicationCommandType, AutocompleteInteraction, ButtonInteraction, ChatInputCommandInteraction, Message } from "discord.js";
import { generateString } from "../../utils/ConfigUtil";
import Client from "../overwrite/Client";

export default class BaseCommand {
    // Основные параметры
    name: string = "commandname";
    usage: string = "Описание функционала команды";
    type: string[] = [];
    requireClient: boolean = false;

    constructor() {
        this.name += `_${generateString}`;
    }
    
    // Дополнительные
    slash: ApplicationCommandData = { 
        name: this.name, 
        description: this.usage, 
        type: ApplicationCommandType.ChatInput, 
        options: []
    };
    buttons: string[] = [];
    selects: string[] = [];
    modals: string[] = [];

    async onMessageCreate(message: Message, client?: Client): Promise<void>
    async onMessageCreate(message: Message, client: Client): Promise<void> {
        // do nothing
    }

    async onAutocomplete(interaction: AutocompleteInteraction, client?: Client): Promise<boolean>
    async onAutocomplete(interaction: AutocompleteInteraction, client: Client): Promise<boolean> {
        // do nothing
        return false;
    }

    async onChatInputCommand(interaction: ChatInputCommandInteraction, client?: Client): Promise<boolean>
    async onChatInputCommand(interaction: ChatInputCommandInteraction, client: Client): Promise<boolean> {
        // do nothing
        return false;
    }

    async onButtonComponent(interaction: ButtonInteraction, client?: Client): Promise<boolean>
    async onButtonComponent(interaction: ButtonInteraction, client: Client): Promise<boolean> {
        // do nothing
        return false;
    }

    async onSelectMenuComponent(interaction: AnySelectMenuInteraction, client?: Client): Promise<boolean>
    async onSelectMenuComponent(interaction: AnySelectMenuInteraction, client: Client): Promise<boolean> {
        // do nothing
        return false;
    }
}