import { AutocompleteInteraction, ButtonInteraction, ChannelSelectMenuInteraction, ChatInputCommandInteraction, Collection, Events, InteractionType, MentionableSelectMenuInteraction, ModalSubmitInteraction, RoleSelectMenuInteraction, StringSelectMenuInteraction, UserSelectMenuInteraction } from "discord.js";
import BaseCommand from "../structures/handlers/BaseCommand";

import Client from "../structures/overwrite/Client";
import Embed from "../structures/overwrite/EmbedBuilder";
import { BaseEvent } from "../structures/Types";
import { _replyCommandError } from "../utils/ConfigUtil";

let cooldown: Collection<string, number> = new Collection();

const event: BaseEvent = {
    name: Events.InteractionCreate,
    once: false,
    // Уж извините за any, пошло оно все в п/////
    async execute(client: Client, interaction: any) {

        // Кулдаун на команды 
        if (interaction?.type != InteractionType.ApplicationCommandAutocomplete && interaction?.type != InteractionType.ModalSubmit) {
            const userCooldown = cooldown.get(interaction.user.id) ?? 0;
            if (Date.now() - userCooldown < 2000) {
                if (interaction instanceof ButtonInteraction) {
                    interaction.deferUpdate();
                } else 
                interaction.reply({
                    embeds: [ new Embed(`На команды бота установлен кулдаун :/`) ],
                    ephemeral: true
                }).catch(() => {});
                client.logger.send(`[EVENTS|${this.name.toUpperCase()}|${interaction.user.id}] Кулдаун команды.`);
                return;
            }
            cooldown.set(interaction.user.id, Date.now());
            cooldown = cooldown.filter((userCooldown) => Date.now() - userCooldown < 2000);
		}

        if (interaction instanceof AutocompleteInteraction) {
            const command: BaseCommand | undefined = client.commands.get(interaction.commandName);

            client.logger.send(`[EVENTS|${this.name.toUpperCase()}|${interaction.user.id}|AUTOCOMPLETE] Вызов команды ${interaction.commandName}`);

            if (command && (await command.onAutocomplete(interaction, command.requireClient ? client : undefined).catch((error) => _replyCommandError(error, client.logger, interaction.commandName, interaction?.guildId, interaction)))) {
                // do nothing
            } else if (!command) {
                interaction.respond([]);
                client.logger.error(`[EVENTS|${this.name.toUpperCase()}|${interaction.user.id}|ERROR] Ошибка выполнения ${interaction.commandName} (${interaction.constructor.name}).`, new Error("Команда не найдена. Поиск перезапущен."));
                (await import(`../handlers/commands`))
                    .default(client)
                    .catch((error: Error) => client.logger.error(`[EVENTS|${this.name.toUpperCase()}|${interaction.user.id}|AUTOCOMPLETE|HANDLER|ERROR]`, error));
            }
        }
        
        if (interaction instanceof ChatInputCommandInteraction) {
            const command: BaseCommand | undefined = client.commands.get(interaction.commandName);

            client.logger.send(`[EVENTS|${this.name.toUpperCase()}|${interaction.user.id}|CHATINPUT] Вызов команды ${interaction.commandName}`);

            if (command && (await command.onChatInputCommand(interaction, command.requireClient ? client : undefined).catch((error) => _replyCommandError(error, client.logger, interaction.commandName, interaction?.guildId, interaction)))) {
                // do nothing
            } else if (!command) {
                _replyCommandError(new Error("Команда не найдена. Поиск перезапущен."), client.logger, interaction.commandName, interaction?.guildId, interaction);
                
                (await import(`../handlers/commands`))
                    .default(client)
                    .catch((error: Error) => client.logger.error(`[EVENTS|${this.name.toUpperCase()}|${interaction.user.id}|CHATINPUT|HANDLER|ERROR]`, error));
            }
        }

        if (interaction instanceof ButtonInteraction) {
            const commands: Collection<string, BaseCommand> = client.commands.filter((command) => command.buttons.includes(interaction.customId));

            client.logger.send(`[EVENTS|${this.name.toUpperCase()}|${interaction.user.id}|BUTTON] Вызов команды ${interaction.customId} (${commands.size})`);

            if (commands.size != 0 && (await commands.first()!.onButtonComponent(interaction, commands.first()!.requireClient ? client : undefined).catch((error) => _replyCommandError(error, client.logger, interaction.customId, interaction?.guildId, interaction)))) {
                // do nothing
            } else if (commands.size == 0) {

                _replyCommandError(new Error(`Команда с компонентом "${interaction.customId}" не найдена. Поиск перезапущен.`), client.logger, interaction.customId, interaction?.guildId, interaction);
                
                (await import(`../handlers/commands`))
                    .default(client)
                    .catch((error: Error) => client.logger.error(`[EVENTS|${this.name.toUpperCase()}|${interaction.user.id}|BUTTON|HANDLER|ERROR]`, error));
            }
        }

        if (interaction instanceof StringSelectMenuInteraction || 
            interaction instanceof UserSelectMenuInteraction || 
            interaction instanceof RoleSelectMenuInteraction || 
            interaction instanceof MentionableSelectMenuInteraction || 
            interaction instanceof ChannelSelectMenuInteraction) {
            const commands: Collection<string, BaseCommand> = client.commands.filter((command) => command.selects.includes(interaction.customId));

            client.logger.send(`[EVENTS|${this.name.toUpperCase()}|${interaction.user.id}|SELECT] Вызов команды ${interaction.customId} (${commands.size})`);

            if (commands.size != 0 && (await commands.first()!.onSelectMenuComponent(interaction, commands.first()!.requireClient ? client : undefined).catch((error) => _replyCommandError(error, client.logger, interaction.customId, interaction?.guildId, interaction)))) {
                // do nothing
            } else if (commands.size == 0) {
                _replyCommandError(new Error(`Команда с компонентом "${interaction.customId}" не найдена. Поиск перезапущен.`), client.logger, interaction.customId, interaction?.guildId, interaction);
                
                (await import(`../handlers/commands`))
                    .default(client)
                    .catch((error: Error) => client.logger.error(`[EVENTS|${this.name.toUpperCase()}|${interaction.user.id}|SELECT|HANDLER|ERROR]`, error));
            }
        }

        if (interaction instanceof ModalSubmitInteraction) {
            const commands: Collection<string, BaseCommand> = client.commands.filter((command) => command.modals.includes(interaction.customId));

            client.logger.send(`[EVENTS|${this.name.toUpperCase()}|${interaction.user.id}|MODAL] Вызов команды ${interaction.customId} (${commands.size})`);

            if (commands.size == 0) {
                interaction.deferUpdate();
                _replyCommandError(new Error(`Команда с компонентом "${interaction.customId}" не найдена. Поиск перезапущен.`), client.logger, interaction.customId, interaction?.guildId, interaction);
                
                (await import(`../handlers/commands`))
                    .default(client)
                    .catch((error: Error) => client.logger.error(`[EVENTS|${this.name.toUpperCase()}|${interaction.user.id}|MODAL|HANDLER|ERROR]`, error));
            }
        }
    }
}

export default event;