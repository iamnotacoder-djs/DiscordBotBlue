import { ActionRowBuilder, ApplicationCommandData, ApplicationCommandOptionType, ApplicationCommandType, ButtonBuilder, ButtonInteraction, ButtonStyle, CacheType, ChatInputCommandInteraction, GuildMember, TextBasedChannel, TextChannel } from "discord.js";
import BaseCommand from "../../structures/handlers/BaseCommand";
import Client from "../../structures/overwrite/Client";
import Embed from "../../structures/overwrite/EmbedBuilder";
import { PollAnswer, PollData } from "../../structures/Types";
import { CommandType } from "../../utils/ConfigUtil";
import { channel_hub_main } from "../../utils/IDs";

export default class Math extends BaseCommand {
    

    // Основные параметры
	name: string = "poll";
	usage: string = "Создать голосование [LVL: 10]";
    type: string[] = [ CommandType.SlashApplication ];
	slash: ApplicationCommandData = {
		name: this.name,
		description: this.usage,
		type: ApplicationCommandType.ChatInput,
		options: [
            {
                name: "time",
                description: "Время на голосование в минутах",
				minValue: 1,
				type: ApplicationCommandOptionType.Integer,
                required: true
            }, {
                name: "question",
                description: "Вопрос",
				type: ApplicationCommandOptionType.String,
                required: true
            }, {
                name: "answer1",
                description: "Ответ 1",
				type: ApplicationCommandOptionType.String,
                required: true,
				maxLength: 32
            }, {
                name: "answer2",
                description: "Ответ 2",
				type: ApplicationCommandOptionType.String,
                required: true,
				maxLength: 32
            }, {
                name: "answer3",
                description: "Ответ 3",
				type: ApplicationCommandOptionType.String,
				maxLength: 32
            }, {
                name: "answer4",
                description: "Ответ 4",
				type: ApplicationCommandOptionType.String,
				maxLength: 32
            }, {
                name: "answer5",
                description: "Ответ 5",
				type: ApplicationCommandOptionType.String,
				maxLength: 32
            }, {
                name: "image",
                description: "Изображение",
				type: ApplicationCommandOptionType.Attachment
            }
		],
		dmPermission: true
	};
    requireClient = true;
	buttons: string[] = [ "button_poll_answer1", "button_poll_answer2", "button_poll_answer3", "button_poll_answer4", "button_poll_answer5" ];

	constructor() { super(); }

    async onChatInputCommand(interaction: ChatInputCommandInteraction<CacheType>, client: Client): Promise<boolean> {

		const profile = await client.lvls.get(interaction.user.id);
		if (profile.lvl < 10) {
			interaction.reply({
				content: "Для доступа к команде необходим 10 уровень на сервере." + "\n" + 
						 `У тебя - ${profile.lvl}.`,
				ephemeral: true
			});

			client.logger.send(`[COMMANDS|${this.name.toUpperCase()}|${interaction.user.id}] ${interaction.user.username} ${this.usage} (${profile.lvl})`);

			return true;
		}

        let time = interaction.options.getInteger("time") ?? 0; 
		time = time < 1 ? 1 : time > 60 * 24 * 7 ? 60 * 24 * 7 : time;

        let poll: PollData = {
            question: interaction.options.getString("question")!,
			answers: [],
            members: [],
            startDate: interaction.createdTimestamp,
            endDate: (interaction.createdTimestamp + 1000 * 60 * time)
        };

        let components = [];
        for (let i = 1; i <= 5; i++) {
			let answer = interaction.options.getString(`answer${i}`);
            if (answer) {
				poll.answers.push({
					index: i,
					answer: answer,
					votes: 0
				});
                components.push(
                    new ActionRowBuilder<ButtonBuilder>()
                        .addComponents(
                            new ButtonBuilder()
                                .setLabel(`${answer} [0]`)
                                .setStyle(ButtonStyle.Primary)
                                .setCustomId(`button_poll_answer${i}`)
                        )
                );
            }
        }

		let channel: TextBasedChannel | null = interaction.channel;
		let member = interaction.member;
		if (!interaction.inGuild()) {
			let _channel = await client.channels.fetch(channel_hub_main).catch(() => {});
			if (_channel instanceof TextChannel) {
				channel = _channel;
				let _member = await _channel.guild.members.fetch(interaction.user.id).catch(() => {});
				if (_member) member = _member;
			}
		}
		
		if (!(channel instanceof TextChannel) || !(member instanceof GuildMember)) {
			interaction.reply({ 
				content: "Что-то пошло не так.", 
				ephemeral: true
			});
			return true;
		}

		let image = interaction.options.getAttachment("image");
		poll.image = image ? image.url : undefined;

        const message = await channel.send({
            embeds: [
                new Embed()
                    .setTitle(poll.question)
                    .setDescription(`Дата окончания голосования: <t:${~~(poll.endDate/1000)}:F>`) 
		    		.setImage(image ? image.url : null)
                    .setAuthor({
                        name: member.displayName, 
                        iconURL: member.displayAvatarURL(),
                        url: `https://discordapp.com/users/${interaction.user.id}/`
                    })
            ],
            components: components,
			// files: image ? [ image ] : []
        }).catch(() => {});

		if (message) {
			client.db.set<PollData>(`polls_p${message.id}`, poll);
	
			interaction.reply({
				content: "Голосование было создано:" + "\n" + `${message.url}`,
				ephemeral: true
			});
	
			message.startThread( { name: `[Голосование] ${poll.question}`.substring(0, 32) } )
				.then(async (thread) => {
					thread.send(`<@${interaction.user.id}>`).then((m) => m.delete());
					thread.send("Голосовать здесь:" + "\n" + `${message.url}`)
				}).catch(() => {});

		} else {
			interaction.reply({ 
				content: "Что-то пошло не так.", 
				ephemeral: true
			});
		}

        return true;
    }

	async onButtonComponent(interaction: ButtonInteraction<CacheType>, client: Client): Promise<boolean> {
		if (interaction.customId.match(/(button_poll_answer)([1-5])/i)) {
			
			let db = await client.db.get<PollData>(`polls_p${interaction.message.id}`);
			if (!db) {
				interaction.reply({
					content: `🚫 Голосование не доступно.`,
					ephemeral: true
				});
				return true;
			}
			
			if (interaction.createdTimestamp > db.endDate) {

				function indexOfMax(arr: PollAnswer[]) {
					if (arr.length === 0) return -1;

					let max = arr[0].votes;
					let maxIndex = 1;

					for (let i = 1; i < arr.length; i++) {
						if (arr[i].votes > max) {
							maxIndex = arr[i].index;
							max = arr[i].votes;
						}
					}

					return maxIndex;
				}

				const higest = indexOfMax(db.answers); 
				let components: ActionRowBuilder<ButtonBuilder>[] = [];
				for (let i = 0; i < db.answers.length; i++) {
					components.push(
						new ActionRowBuilder<ButtonBuilder>()
							.addComponents(
								new ButtonBuilder()
									.setLabel(`${db.answers[i].answer} [${db.answers[i].votes}]`) 
									.setStyle(higest == db.answers[i].index ? ButtonStyle.Success: ButtonStyle.Danger)
									.setDisabled(true)
									.setCustomId(`button_poll_answer${db.answers[i].index}`)
							)
					);
				}
				interaction.message.edit({
					embeds: interaction.message.embeds,
					components: components
				});

				interaction.reply({
					content: `🚫 Голосование окончено!`,
					ephemeral: true
				});
				
				client.db.delete(`polls_p${interaction.message.id}`);

				return true;
			}
			if (db.members.includes(interaction.user.id)) {
				interaction.reply({
					content: `🚫 Ты уже принял участие в голосовании!`,
					ephemeral: true
				});
				return true;
			}

			db.members = [interaction.user.id, ...new Set(db.members)];

			let components: ActionRowBuilder<ButtonBuilder>[] = [];
			
			for (let i = 0; i < db.answers.length; i++) {
				let label = `${db.answers[i].answer} [${db.answers[i].votes + (interaction.customId == `button_poll_answer${db.answers[i].index}` ? 1 : 0)}]`;
				components.push(
					new ActionRowBuilder<ButtonBuilder>()
						.addComponents(
							new ButtonBuilder()
								.setLabel(label) 
								.setStyle(ButtonStyle.Primary)
								.setCustomId(`button_poll_answer${db.answers[i].index}`)
						)
				);
			}

			db.answers = db.answers.map((item) => ({
				index: item.index,
				answer: item.answer,
				votes: (interaction.customId == `button_poll_answer${item.index}` ? item.votes + 1 : item.votes)
			}));
			
			let description = `Дата окончания голосования: <t:${~~(db.endDate/1000)}:F>` + "\n\n" + 
				`Проголосовало ${db.members.length} человек: ${db.members.map((m) => `<@${m}>`).join(", ")}`;

			interaction.message.edit({
				embeds: [
					new Embed()
						.setTitle(interaction.message.embeds[0].title)
						.setDescription(description) 
						.setImage(db.image ?? null)
						.setAuthor(interaction.message.embeds[0].author)
				],
				components: components
			});

			interaction.reply({
				content: `Твой ответ сохранен!`,
				ephemeral: true
			});

			client.db.set<PollData>(`polls_p${interaction.message.id}`, db);
		
			return true;
		}
		return false;
	}
}