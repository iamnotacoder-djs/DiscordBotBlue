import { AnySelectMenuInteraction, AutocompleteInteraction, ButtonInteraction, ChannelManager, ChatInputCommandInteraction, InteractionReplyOptions, Message, MessageFlags, MessageReplyOptions, ModalSubmitInteraction } from "discord.js";
import Embed from "../structures/overwrite/EmbedBuilder";
import Logger from "./Logger";

export const message_prefix: string = "!";

export const CommandType = { 
    DoNotParse: "donotparse", 
    Message: "message", 
    SlashGuild: "slashguild", 
    SlashApplication: "slashapplication", 
    ContextUserGuild: "contextuserguild", 
    ContextUserApplication: "contextuserapplication", 
    ContextMessageGuild: "contextmessageguild", 
    ContextMessageApplication: "contextmessageapplication"
};

export function replaceAll(string: string, from: string, to: string): string {
    while(string.includes(from)) {
        string = string.replace(from, to);
    }
    return string;
}

export function generateString(length: number = 5): string {
    let result           = '';
    let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

export function validURL(str: string): boolean {
    var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
      '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return !!pattern.test(str) && (str.match(/\.(jpeg|jpg|gif|png)$/) != null);
}

export function _replyCommandError(error: Error, logger: Logger, commandName: string, guildId: string, interaction: ChatInputCommandInteraction | ButtonInteraction | AnySelectMenuInteraction | ModalSubmitInteraction | AutocompleteInteraction | Message): void {
    
    logger.error(`[EVENTS|INTERACTIONCREATE|${guildId.toUpperCase()}|ERROR] Ошибка выполнения ${commandName} (${interaction.constructor.name}).`, error);

    if (interaction instanceof AutocompleteInteraction) {
        interaction.respond([]);
        return;
    }

    let response: InteractionReplyOptions = {
        components: [],
        embeds: [ new Embed(`Ошибка выполнения команды \`${commandName}\`.`) ],
        files: [],
        ephemeral: true
    };
    if (!(interaction instanceof Message) && interaction.replied) {
        interaction.followUp(response).catch(() => {
            response.ephemeral = false;
            interaction.followUp(response).catch(() => {
                interaction.fetchReply()
                    .then((reply) => {
                        response.ephemeral = reply.flags.has(MessageFlags.Ephemeral);
                        interaction.editReply(response).catch(() => {});
                    });
            });
        });
    } else if (interaction instanceof Message) {
        let messageResponse: MessageReplyOptions = {
            components: response.components,
            embeds: response.embeds,
            files: response.files
        };
        interaction.reply(messageResponse).catch(() => {});
    } else {
        interaction.reply(response).catch(() => {
            response.ephemeral = false;
            interaction.reply(response).catch(() => {});
        });
    }
}

export function _replyNullGuild(interaction: ChatInputCommandInteraction): boolean {
    interaction.reply({ content: `Команда доступна лишь на серверах.`, ephemeral: true }).catch(() => {});
    return true;
}

export function _replyNullChannel(interaction: ChatInputCommandInteraction): boolean {
    interaction.reply({ content: `Канал не найден.`, ephemeral: true }).catch(() => {});
    return true;
}

type Newable<T> = { new (...args: any[]): T; };
export async function getChannel<T>(type: Newable<T>, channelManager: ChannelManager, id: string): Promise<T | null> {
    let channel = await channelManager.fetch(id).catch(() => {});
    if (!channel) return null;
    if (channel instanceof type) return channel;
    return null;
}

export async function deferReply(interaction: ChatInputCommandInteraction): Promise<boolean> {
    let action = await interaction.deferReply({ ephemeral: true }).catch(() => {});
    if (!action) return false;
    interaction.deleteReply().catch(() => {});
    return true;
}
