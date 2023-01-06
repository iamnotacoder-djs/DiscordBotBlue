import { createCanvas, loadImage } from "canvas";
import { ActionRowBuilder, ApplicationCommandData, ApplicationCommandType, ButtonBuilder, ButtonInteraction, ButtonStyle, CacheType, ChatInputCommandInteraction, GuildMember, MessageEditOptions, ModalBuilder, ModalSubmitInteraction, TextChannel, TextInputBuilder, TextInputStyle } from "discord.js";
import BaseCommand from "../../structures/handlers/BaseCommand";
import Client from "../../structures/overwrite/Client";
import Embed from "../../structures/overwrite/EmbedBuilder";
import { SupportRole, SupportRoleMenu } from "../../structures/Types";
import { CommandType, validURL } from "../../utils/ConfigUtil";
import { main_guild, role_support_b2, role_support_b3, role_support_boosty, role_support_nitro } from "../../utils/IDs";

export default class SupportRoles extends BaseCommand {
    
    // Основные параметры
	name: string = "role";
	usage: string = "Настройка личной роли для бустеров сервера С:";
    type: string[] = [ CommandType.SlashApplication ];
	slash: ApplicationCommandData = {
		name: this.name,
		description: this.usage,
		type: ApplicationCommandType.ChatInput,
		options: [],
		dmPermission: true
	};
    requireClient = true;
	buttons: string[] = [ "button_role_create", "button_role_delete", "button_role_rename", "button_role_emoji", "button_role_color", "button_role_hoist" ];
	modals: string[] = [ "modal_role_rename", "modal_role_emoji", "modal_role_color", "modal_role_hoist" ];

	constructor() { super(); }

    async onChatInputCommand(interaction: ChatInputCommandInteraction<CacheType>, client: Client): Promise<boolean> {

		let dbRoles = await client.db.get(`support_roles`);
		if (!dbRoles) await client.db.set(`support_roles`, {});

        const guild = await client.guilds.fetch(main_guild).catch(() => {});
		if (!guild) {
			interaction.reply({ content: "Что-то пошло не так.", ephemeral: true });
			return true;
		}

		const member = await guild.members.fetch(interaction.user.id).catch(() => {});
		if (!member) {
			interaction.reply({ content: 'Что-то пошло не так.', ephemeral: true });
			return true;
		}

		if (member.roles.cache.some(r => [role_support_boosty, role_support_nitro].includes(r.id))) {
			const reply = await this.getMenu(client, member);
			const message = await interaction.reply({
                embeds: reply.embeds,
                components: reply.components,
                fetchReply: true
            });
			client.db.set<SupportRoleMenu>(`support_roles.messages.u_${member.id}`, {
				message: message.id,
				channel: interaction.channelId
			});
		} else {
			interaction.reply({
				embeds: [
					new Embed()
						.setTitle(`Личная роль`)
						.setDescription(`Для доступа к команде требуется любая из ролей в наличии: <@&${role_support_boosty}> <@&${role_support_nitro}>`)
				],
				ephemeral: true
			});
		}

        client.logger.send(`[COMMANDS|${this.name.toUpperCase()}|${interaction.user.id}] ${interaction.user.username} ${this.usage} \`Есть роль: ${member.roles.cache.some(r => [role_support_boosty, role_support_nitro].includes(r.id))}\``);

        return true;
    }

    async getMenu(client: Client, member: GuildMember): Promise<MessageEditOptions> {
		let role = await client.db.get<SupportRole>(`support_roles.u_${member.id}`);
		if (!role) {
			role = { color: "#ffffff", name: "СаппортРоль", emojiURL: "", hoist: false, id: null };
			await client.db.set(`support_roles.u_${member.id}`, role);
		}

        let roleDescription = `> <@&${role.id}>` + "\n" + "> ",
            components = [
                new ActionRowBuilder<ButtonBuilder>()
            ];
        
        if (role.id == undefined) {
            roleDescription = "> **Роль не создана**" + "\n" + "> ";
            components[0].addComponents(
                new ButtonBuilder()
                    .setCustomId("button_role_create")
                    .setLabel("Создать роль") 
                    .setStyle(ButtonStyle.Primary)
            )
        } else {
            components[0].addComponents(
                new ButtonBuilder()
                    .setCustomId("button_role_delete")
                    .setLabel("Удалить роль") 
                    .setStyle(ButtonStyle.Primary)
            )
        }
        components.push(
            new ActionRowBuilder<ButtonBuilder>()
                .addComponents([
                    new ButtonBuilder()
                        .setCustomId("button_role_rename")
                        .setLabel("Название") 
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId("button_role_color")
                        .setLabel("Цвет") 
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId("button_role_emoji")
                        .setLabel("Иконка") 
                        .setStyle(ButtonStyle.Secondary)
                ])
        );

        roleDescription += `\n> **Название:** ${role.name}\n> **Цвет:** ${role.color}\n> **Иконка:** ${role.emojiURL == `` ? `Не установлена` : role.emojiURL}\n> **Выделение в списке:** `;

        if (member.roles.cache.some(r => [ role_support_b2, role_support_b3 ].includes(r.id))) {
            roleDescription += `${role.hoist ? "Включено" : "Выключено"}`;
            components[1].addComponents(
                new ButtonBuilder()
                    .setCustomId("button_role_hoist")
                    .setLabel("Hoist") 
                    .setStyle(ButtonStyle.Secondary)
            )
        } else {
            role.hoist = false;
            await client.db.set(`support_roles.u_${member.id}.hoist`, false);
            roleDescription += `Выключено (Доступно только саппортам уровня <@&${role_support_b2}> и выше)`;
            components[1].addComponents(
                new ButtonBuilder()
                    .setCustomId("button_role_hoist")
                    .setLabel("Hoist") 
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
            )
        }

        return {
            embeds: [
                new Embed()
                    .setTitle("Личная роль")
                    .setDescription(`Роль <@${member.id}>` + "\n\n" + roleDescription)
            ],
            components: components
        };
    }

    async onButtonComponent(interaction: ButtonInteraction<CacheType>, client: Client): Promise<boolean> {
        const guild = await client.guilds.fetch(main_guild).catch(() => {});
		if (!guild) {
			interaction.reply({ content: "Что-то пошло не так.", ephemeral: true });
			return true;
		}

		const member = await guild.members.fetch(interaction.user.id).catch(() => {});
		if (!member) {
			interaction.reply({ content: 'Что-то пошло не так.', ephemeral: true });
			return true;
		}

        if (!member.roles.cache.some(r => [role_support_boosty, role_support_nitro].includes(r.id))) {
            interaction.reply({
                embeds: [
                    new Embed()
                        .setTitle("Личная роль")
                        .setDescription("Для доступа к меню требуется любая из ролей в наличии: " + `<@&${role_support_boosty}> <@&${role_support_nitro}>`)
                ],
                ephemeral: true
            });
			return true;
        }

        if (interaction.customId == "button_role_create") {

            await this.deleteRole(client, member);
            await this.createRole(client, member);
            this.updateMenuMessage(client, member);

            interaction.reply({
                content: "Роль создана и выдана",
                ephemeral: true
            });
        }

        if (interaction.customId == "button_role_delete") {

            await this.deleteRole(client, member);
            this.updateMenuMessage(client, member);

            interaction.reply({
                content: "Роль удалена",
                ephemeral: true
            });
        }

        if (interaction.customId == "button_role_rename") {
            interaction.showModal(
                new ModalBuilder()
                    .setCustomId("modal_role_rename")
                    .setTitle("Личная роль")
                    .setComponents([
                        new ActionRowBuilder<TextInputBuilder>()
                            .addComponents(
                                new TextInputBuilder()
                                    .setCustomId("name")
                                    .setLabel("Название роли")
                                    .setStyle(TextInputStyle.Short)
                                    .setMinLength(2)
                                    .setMaxLength(20)
                                    .setPlaceholder(member.displayName)
                                    .setRequired(true)
                            )
                    ])
            );
            const filter = (interaction: ModalSubmitInteraction) => interaction.customId === "modal_role_rename";
            interaction.awaitModalSubmit({ filter, time: 120000 })
                .then(async (interaction) => {
                    const name = interaction.fields.getTextInputValue("name");

                    await client.db.set(`support_roles.u_${member.id}.name`, name);

                    await this.setRoleName(client, member);
					this.updateMenuMessage(client, member);

					interaction.reply({
						content: "Роль обновлена",
						ephemeral: true
					});
                }).catch(() => {});
        }

        if (interaction.customId == "button_role_emoji") {
            interaction.showModal(
                new ModalBuilder()
                    .setCustomId("modal_role_emoji")
                    .setTitle("Личная роль")
                    .setComponents([
                        new ActionRowBuilder<TextInputBuilder>()
                            .addComponents(
                                new TextInputBuilder()
                                    .setCustomId("emoji")
                                    .setLabel("Ссылка на иконку")
                                    .setStyle(TextInputStyle.Short)
                                    .setMinLength(10)
                                    .setPlaceholder("http://roomcreator.iamnotacoder.ru/images/logo.png")
                                    .setRequired(true)
                            )
                    ])
            );
            const filter = (interaction: ModalSubmitInteraction) => interaction.customId === "modal_role_emoji";
            interaction.awaitModalSubmit({ filter, time: 120000 })
                .then(async (interaction) => {
                    const emoji = interaction.fields.getTextInputValue("emoji");

                    if (validURL(emoji)) {
                        await client.db.set(`support_roles.u_${member.id}.emojiURL`, emoji);

                        await this.setRoleEmoji(client, member);
						this.updateMenuMessage(client, member);
    
                        interaction.reply({
                            content: "Роль обновлена",
                            ephemeral: true
                        });
                    } else {
                        interaction.reply({
                            content: "Не удалось распознать ссылку на изображение в строке:" + `\`\`\`${emoji}\`\`\``,
                            ephemeral: true
                        });
                    }
                }).catch(() => {});
        }

        if (interaction.customId == "button_role_color") {
            interaction.showModal(
                new ModalBuilder()
                    .setCustomId("modal_role_color")
                    .setTitle("Личная роль")
                    .setComponents([
                        new ActionRowBuilder<TextInputBuilder>()
                            .addComponents(
                                new TextInputBuilder()
                                    .setCustomId("color")
                                    .setLabel("Цвет в HEX формате")
                                    .setStyle(TextInputStyle.Short)
                                    .setMinLength(4)
                                    .setMaxLength(7)
                                    .setPlaceholder("#ffffff")
                                    .setRequired(true)
                            )
                    ])
            );
            const filter = (interaction: ModalSubmitInteraction) => interaction.customId === "modal_role_color";
            interaction.awaitModalSubmit({ filter, time: 120000 })
                .then(async (interaction) => {
                    const color = interaction.fields.getTextInputValue("color");
                    const regHex = /^#([0-9a-f]{3}){1,2}$/i;

                    if (regHex.test(color)) {
                        await client.db.set(`support_roles.u_${member.id}.color`, color);

                        await this.setRoleColor(client, member);
						this.updateMenuMessage(client, member);
    
                        interaction.reply({
                            content: "Роль обновлена",
                            ephemeral: true
                        });
                    } else {
                        interaction.reply({
                            content: "Не удалось распознать цвет (hex) в строке:" + `\`\`\`${color}\`\`\``,
                            ephemeral: true
                        });
                    }
                }).catch(() => {});
        }

        if (interaction.customId == "button_role_hoist") {
            interaction.showModal(
                new ModalBuilder()
                    .setCustomId("modal_role_hoist")
                    .setTitle("Личная роль")
                    .setComponents([
                        new ActionRowBuilder<TextInputBuilder>()
                            .addComponents(
                                new TextInputBuilder()
                                    .setCustomId("hoist")
                                    .setLabel("Выделять от других ролей в списке")
                                    .setStyle(TextInputStyle.Short)
                                    .setMinLength(2)
                                    .setMaxLength(3)
                                    .setPlaceholder(`Да/Нет`)
                                    .setRequired(true)
                            )
                    ])
            );
            const filter = (interaction: ModalSubmitInteraction) => interaction.customId === "modal_role_color";
            interaction.awaitModalSubmit({ filter, time: 120000 })
                .then(async (interaction) => {
                    const _hoist = interaction.fields.getTextInputValue("hoist");
                    let hoist = false;
                    if (['да', 'даа', 'дда', "yes", "yep", '+', '+++', '++'].includes(_hoist.toLowerCase())) hoist = true;

                    if (member.roles.cache.some(r => [role_support_b2, role_support_b3].includes(r.id))) {
                        await client.db.set(`support_roles.u_${member.id}.hoist`, hoist);

                        await this.setRoleHoist(client, member);
						this.updateMenuMessage(client, member);
    
                        interaction.reply({
                            content: "Роль обновлена",
                            ephemeral: true
                        });
                    } else {
                        interaction.reply({
                            content: "Для доступа к меню требуется любая из ролей в наличии: " + `<@&${role_support_b2}> <@&${role_support_b3}>`,
                            ephemeral: true
                        });
                    }
                }).catch(() => {});
        }
    
        return true;
    }

    async deleteRole(client: Client, member: GuildMember) {
		let role = await client.db.get<SupportRole>(`support_roles.u_${member.id}`);
		if (!role) {
			role = {
				color: `#ffffff`,
				name: `СаппортРоль`,
				emojiURL: ``,
				hoist: false,
                id: null
			};
			await client.db.set<SupportRole>(`support_roles.u_${member.id}`, role);
		}
		if (!role.id) {
			return;
		} else {
			const supportRole = await member.guild.roles.fetch(role.id).catch(() => {});
			if (supportRole) {
				if (supportRole.editable) supportRole.delete();
				await client.db.set<SupportRole>(`support_roles.u_${member.id}`, {
					color: role.color,
					name: role.name,
					emojiURL: role.emojiURL,
					hoist: role.hoist,
                    id: null
				});
			} else {
				await client.db.set<SupportRole>(`support_roles.u_${member.id}`, {
					color: role.color,
					name: role.name,
					emojiURL: role.emojiURL,
					hoist: role.hoist,
                    id: null
				});
			}
		}
    }

    async createRole(client: Client, member: GuildMember) {
		let role = await client.db.get<SupportRole>(`support_roles.u_${member.id}`);
		if (!role) {
			role = {
				color: `#ffffff`,
				name: `СаппортРоль`,
				emojiURL: ``,
				hoist: false,
                id: null
			};
			await client.db.set<SupportRole>(`support_roles.u_${member.id}`, role);
		}
		const _role_premium = await member.guild.roles.fetch(role_support_boosty).catch(() => {});
		const supportRole = await member.guild.roles.create({
				name: role.name,
				color: role.color,
				position: (_role_premium ? _role_premium.position + 1 : undefined),
				hoist: role.hoist
			}).catch(() => {});
		if (supportRole) {
			await member.roles.add(supportRole).catch(() => {});
			await client.db.set<string>(`support_roles.u_${member.id}.id`, supportRole.id);
			this.setRoleEmoji(client, member);
		}
    }

    async setRoleEmoji(client: Client, member: GuildMember) {
		let role = await client.db.get<SupportRole>(`support_roles.u_${member.id}`);
		if (!role) {
			role = {
				color: `#ffffff`,
				name: `СаппортРоль`,
				emojiURL: ``,
				hoist: false,
                id: null
			};
			await client.db.set<SupportRole>(`support_roles.u_${member.id}`, role);
		}
		if (member.guild.premiumSubscriptionCount && member.guild.premiumSubscriptionCount >= 7 && role.id) {
			if (validURL(role.emojiURL)) {
				const icon = await loadImage(role.emojiURL).catch(() => {});
				if (icon != undefined) {
					const canvas = createCanvas(64, 64);
					const context = canvas.getContext('2d');
					context.drawImage(icon, 0, 0, 64, 64);
					const buffer = canvas.toBuffer('image/png');
					const supportRole = await member.guild.roles.fetch(role.id).catch(() => {});
					if (supportRole) {
						await supportRole.setIcon(buffer).catch(() => {});
					} else {
						await client.db.set<SupportRole>(`support_roles.u_${member.id}`, {
							color: role.color,
							name: role.name,
							emojiURL: role.emojiURL,
							hoist: role.hoist
						});
					}
				}
			}
		}
    }

    async setRoleName(client: Client, member: GuildMember) {
		let role = await client.db.get<SupportRole>(`support_roles.u_${member.id}`);
		if (!role) {
			role = {
				color: `#ffffff`,
				name: `СаппортРоль`,
				emojiURL: ``,
				hoist: false,
                id: null
			};
			await client.db.set<SupportRole>(`support_roles.u_${member.id}`, role);
		}
		if (role.id) {
			const supportRole = await member.guild.roles.fetch(role.id).catch(() => {});
			if (supportRole) {
				await supportRole.setName(role.name).catch(() => {});
			} else {
				await client.db.set<SupportRole>(`support_roles.u_${member.id}`, {
					color: role.color,
					name: role.name,
					emojiURL: role.emojiURL,
					hoist: role.hoist
				});
			}
		}
    }

    async setRoleColor(client: Client, member: GuildMember) {
		let role = await client.db.get<SupportRole>(`support_roles.u_${member.id}`);
		if (!role) {
			role = {
				color: `#ffffff`,
				name: `СаппортРоль`,
				emojiURL: ``,
				hoist: false,
                id: null
			};
			await client.db.set<SupportRole>(`support_roles.u_${member.id}`, role);
		}
		if (role.id) {
			const supportRole = await member.guild.roles.fetch(role.id).catch(() => {});
			if (supportRole) {
				await supportRole.setColor(role.color).catch(() => {});
			} else {
				await client.db.set<SupportRole>(`support_roles.u_${member.id}`, {
					color: role.color,
					name: role.name,
					emojiURL: role.emojiURL,
					hoist: role.hoist
				});
			}
		}
    }

    async setRoleHoist(client: Client, member: GuildMember) {
		let role = await client.db.get<SupportRole>(`support_roles.u_${member.id}`);
		if (!role) {
			role = {
				color: `#ffffff`,
				name: `СаппортРоль`,
				emojiURL: ``,
				hoist: false,
                id: null
			};
			await client.db.set<SupportRole>(`support_roles.u_${member.id}`, role);
		}
		if (role.id) {
			const supportRole = await member.guild.roles.fetch(role.id).catch(() => {});
			if (supportRole) {
				await supportRole.setHoist(role.hoist).catch(() => {});
			} else {
				await client.db.set<SupportRole>(`support_roles.u_${member.id}`, {
					color: role.color,
					name: role.name,
					emojiURL: role.emojiURL,
					hoist: role.hoist
				});
			}
		}
    }

    async updateMenuMessage(client: Client, member: GuildMember) {
        let reply = await client.db.get<SupportRoleMenu>(`support_roles.messages.u_${member.id}`);
		if (reply) {
			const channel = await client.channels.fetch(reply.channel).catch(() => {});
			if (channel instanceof TextChannel) {
				const message = await channel.messages.fetch(reply.message).catch(() => {});
				if (message) {
					message.edit(await this.getMenu(client, member)).catch(() => {});
				}
			}
		}
    }

}