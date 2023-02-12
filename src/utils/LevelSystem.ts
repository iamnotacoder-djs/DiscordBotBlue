import { createCanvas, loadImage, registerFont } from "canvas";
import { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, GuildScheduledEventEntityType, GuildScheduledEventPrivacyLevel, HexColorString, InteractionReplyOptions, MessageCreateOptions, StringSelectMenuBuilder, ThreadChannel } from "discord.js";
import fs from "fs";
import Client from "../structures/overwrite/Client";
import Embed from "../structures/overwrite/EmbedBuilder";
import { BotOwnerData, LevelSystemAddOptions, LevelSystemSetOptions, ModelArchieve, ModelUser } from "../structures/Types";
import { main_guild, roles_colors } from "./IDs";

// TODO Перенести монго
export default class LevelSystem {

	Badges = {
		'Hypesquad': '`Hypesquad Events` <:hypesquadevents:1011512419627057162>',
		'HypeSquadOnlineHouse2': '`HypeSquad Brilliance House` <:brilliance:1011512405668409416>',
		'HypeSquadOnlineHouse1': '`HypeSquad Bravery House` <:bravery:1011512404250726490>',
		'HypeSquadOnlineHouse3': '`HypeSquad Balance House` <:balance:1011512402891771914>',
		'BugHunterLevel1': '`Normal Bug Hunter` <:bughunter:1011512408793174047>',
		'BugHunterLevel2': '`Bug Buster` <:bugbuster:1011512406947663893>',
		'PremiumEarlySupporter': '`Early Supporter` <:earlysupporter:1011512415210455070>',
		'VerifiedDeveloper': '`Early Verified Bot Developer` <:verifieddeveloper:1011512416623931452>',
		'ActiveDeveloper': '`Active Developer` <:activedeveloper:1060990856124960889>',
		'CertifiedModerator': '`Discord Certified Moderators` <:moderator:1011512410382794842>',
		'VerifiedBot': '`Verified Bot` <:verified:1011512423733280770>',
		'SYSTEM': '`System` <:verified:1011512423733280770>',
		'BotHTTPInteractions': '`Bot` <:verified:1011512423733280770>',
		'Spammer': '`Bot` <:verified:1011512423733280770>',
		'Quarantined': '`Bot` <:verified:1011512423733280770>',

		'Partner': '`Discord Partner` <:partner:1011512412173783111>',

		'TeamPseudoUser': '`Team User` <:staff:1011512413805367346>',
		'Staff': '`Discord Staff` <:staff:1011512413805367346>'
	};

	ProfileTypes = [ 'Старый формат', 'Компактный (аватар-слева)', 'Компактный (аватар по центру)' ];
    client: Client;

	constructor(client: Client) {
		this.client = client;
		client.logger.send("[LEVELSYSTEM|CONSTRUCTOR] Модуль LevelSystem инициализирован.");
	}

	async get(user_id: string): Promise<ModelUser> {
		let member = await this.client.db.get<ModelUser>(`lvlsystem_user_${user_id}`);
		let invited_bot = 'undefined';
		let dbBotsArray = await this.client.db.get<BotOwnerData[]>("botowner_bots") ?? [];
		if (dbBotsArray != null) {
			for(let db of dbBotsArray) {
				if (db.owner_id == user_id) {
					invited_bot = db.client_id;
				}
			}
		}
		if (!member) {
			const guild = await this.client.guilds.fetch(main_guild);
			const guild_member = await guild.members.fetch(user_id).catch(() => {});
			let joinedAt = Date.now(), roles: string[] = [];
			if (guild_member) {
				roles = guild_member.roles.cache.filter((r) => r.id != guild.id).map((r) => r.id) ?? [];
				joinedAt = guild_member.joinedTimestamp ?? Date.now();
			}
            member = {
                id: user_id,
                lvl: 1,
                lvl_date: Date.now(),
                exp: 0,
                profile_type: 1,
                messages: 0,
                voiceminutes: 0,
                reactions: 0,
                emojis: 0,
                pictures: 0,
                stickers: 0,
                archieve: [], 
                invited_bot: invited_bot,
                roles: roles,
                joinedAt: joinedAt
            };
			this.client.db.set<ModelUser>(`lvlsystem_user_${user_id}`, member);
		}
		return {
			id: user_id,
			lvl: member.lvl,
			lvl_date: member.lvl_date,
			exp: member.exp,
			profile_type: member.profile_type,
			// счетчики
			messages: member.messages,
			voiceminutes: member.voiceminutes,
			reactions: member.reactions,
			emojis: member.emojis,
			pictures: member.pictures,
			stickers: member.stickers,
			// прочее
			archieve: member.archieve, 
			invited_bot: invited_bot,
			roles: member.roles,
			joinedAt: member.joinedAt
		};
	}

	async add(user_id: string, { messages, voiceminutes, reactions, emojis, pictures, stickers, exp }: LevelSystemAddOptions) {
		let member = await this.get(user_id);
		if (messages) {
			member.messages += messages;
			member.exp += 75 * messages * 0.2375;
			member.exp = Math.round(member.exp);
		}
		if (voiceminutes) {
			member.voiceminutes += voiceminutes;
			member.exp += 80 * voiceminutes * 0.2375;
			member.exp = Math.round(member.exp);
		}
		if (reactions) {
			member.reactions += reactions;
			member.exp += 30 * reactions * 0.2375;
			member.exp = Math.round(member.exp);
		}
		if (emojis) {
			member.emojis += emojis;
			member.exp += 20 * emojis * 0.2375;
			member.exp = Math.round(member.exp);
		}
		if (pictures) {
			member.pictures += pictures;
			member.exp += 140 * pictures * 0.2375;
			member.exp = Math.round(member.exp);
		}
		if (stickers) {
			member.stickers += stickers;
			member.exp += 70 * stickers * 0.2375;
			member.exp = Math.round(member.exp);
		}
		if (exp) {
			member.exp += exp;
		}
		let oldLvl = member.lvl;
		if (member.exp < 0) {
			member.exp = 0;
		}
		
		let maxExp = (member.lvl >= 60 ? 
			(1000 + Math.pow(member.lvl - 59, 2) * 20) 
			: 1000);
		while (member.exp >= maxExp && member.lvl < 120) {
			member.exp -= maxExp;
			member.lvl = member.lvl + 1;
			maxExp = member.lvl >= 60 ? 
			(1000 + Math.pow(member.lvl - 59, 2) * 20) 
			: 1000;
		}
		if ((member.lvl - oldLvl) > 10) {
			member.lvl = oldLvl;
		}
		if (member.lvl >= 120) {
			member.lvl = 120;
		}
		this.client.db.set<ModelUser>(`lvlsystem_user_${user_id}`, member);
	}

	async set(user_id: string, { lvl, messages, voiceminutes, reactions, emojis, pictures, stickers, github, boosty, roles, invited_bot, profile_type }: LevelSystemSetOptions) {
		let member = await this.get(user_id);
		if (lvl != undefined) member.lvl = lvl;
		if (messages != undefined) member.messages = messages;
		if (voiceminutes != undefined) member.voiceminutes = voiceminutes;
		if (reactions != undefined) member.reactions = reactions;
		if (emojis != undefined) member.emojis = emojis;
		if (pictures != undefined) member.pictures = pictures;
		if (stickers != undefined) member.stickers = stickers;
		if (roles) member.roles = roles;
		if (invited_bot != undefined) member.invited_bot = invited_bot;
		if (profile_type != undefined) member.profile_type = profile_type;
		await this.client.db.set<ModelUser>(`lvlsystem_user_${user_id}`, member);
	}

	async notifyAboutCleanUserStats() {
        let db_channel = await this.client.db.get<string>("about_thread_news");
        if (!db_channel) throw new Error(`Канал about_thread_news <#${db_channel}> (${db_channel}) не найден.`);
        
        const channel = await this.client.channels.fetch(db_channel).catch(() => {});
        if (!channel) throw new Error(`Канал about_thread_news <#${db_channel}> (${db_channel}) не найден на сервере.`);
        if (!(channel instanceof ThreadChannel)) throw new Error(`Канал about_thread_news <#${db_channel}> (${db_channel}) найден на сервере, но не является тредом.`);

        if (channel.archived) await channel.setArchived(false);

        const message = await channel.send({
            content: `@everyone`, 
            embeds: [
                new Embed()
                    .setTitle("Сброс уровней")
                    .setDescription("Первого числа будет произведен сброс уровней: \n> \`10\` -> \`1\`\n > \`20\` -> \`10\`\n > \`30\` -> \`20\`\n > \`30+\` -> \`30\`\n\n Ты можешь сохранить бонусы уровней, если заберешь цветную роль.")
            ]
        }).catch(() => {});

        if (!message) throw new Error(`Сообщение не было отправлено в about_thread_news <#${db_channel}> (${db_channel}).`);

        const now = new Date();
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        message.guild.scheduledEvents.create({
            name: `Сброс уровней`,
            scheduledStartTime: message.createdTimestamp + 1000 * 60,
            scheduledEndTime: lastDay.getTime(),
            privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
            entityType: GuildScheduledEventEntityType.External,
            description: `Первого числа будет произведен ежемесячный сброс уровней. `,
            entityMetadata: { location: message.url },
            reason: `Ежемесячный сброс уровней`
        }).catch(() => {});
	}

	async cleanUserStats() {
		this.client.logger.send("[LEVELSYSTEM|CLEANUSERSTATS] Очистка статов: \`Подготовка к чистке\`");

        let db_channel = await this.client.db.get<string>("about_thread_news");
        if (!db_channel) throw new Error(`Канал about_thread_news <#${db_channel}> (${db_channel}) не найден.`);
        
        const channel = await this.client.channels.fetch(db_channel).catch(() => {});
        if (!channel) throw new Error(`Канал about_thread_news <#${db_channel}> (${db_channel}) не найден на сервере.`);
        if (!(channel instanceof ThreadChannel)) throw new Error(`Канал about_thread_news <#${db_channel}> (${db_channel}) найден на сервере, но не является тредом.`);

		if (channel?.archived) await channel.setArchived(false);

		let members = await this.getTopTenUsers();
		await this.#cleanDBStats();
		await channel.send({
			content: `@everyone`, embeds: [
				new Embed()
					.setTitle("Сброс уровней")
					.setDescription(`Сброс уровней произведен. Спасибо за активность на сервере C:`),
				new Embed()
					.setTitle(`Топ пользователей за прошлый месяц`)
					.setDescription(members.join('\n'))
			]
		}).catch(() => {});

		this.client.logger.send("[LEVELSYSTEM|CLEANUSERSTATS] Очистка статов: `Список ТОП пользователей опубликован`");
	}

    // TODO Перенести на типы
	async getTopTenUsers() {
		const guild = await this.client.guilds.fetch(main_guild).catch(() => {});
        if (!guild) throw new Error(`Сервер не найден.`);

		let result = [];
        let dbMembers = await this.client.db.all();
        dbMembers = dbMembers.filter((m) => m && m.id.startsWith('lvlsystem_user_')).map((m) => m.value);
        // @ts-ignore
        dbMembers = dbMembers.sort((m1, m2) => m2.lvl == m1.lvl ? m1.lvl_date - m2.lvl_date : m2.lvl - m1.lvl);
        // @ts-ignore
        dbMembers = Object.values( dbMembers.reduce( (c, e) => { if (!c[e.id]) c[e.id] = e; return c; }, {}) );

        for (let dbMember of dbMembers) {
            const member = await guild.members.fetch(dbMember.id).catch(() => {});
            if (member && member.displayName && !member.user.bot) {
                // @ts-ignore
                result.push(`#${result.length + 1} <@${member.id}> / ${member.displayName} (\`LVL ${dbMember.lvl}\` <t:${~~(dbMember.lvl_date/1000)}:R>)`);
            }
            if (result.length == 10) break;
        }
        
		return result;
	}

	async #cleanDBStats() {
		this.client.logger.send("[LEVELSYSTEM|CONSTRUCTOR] Очистка статов: \`Выполнение cleanDBStats\`");
		let dbMembers = await this.client.db.all();
		dbMembers = dbMembers.filter((m) => m && m.id.startsWith('lvlsystem_user_'));
		for (let dbMember of dbMembers) {
			let member = dbMember.value;
			if (!Array.isArray(member?.archieve)) member.archieve = [];
			member.archieve.push({
				lvl: member.lvl,
				exp: member.exp,
				thx: member.thx,
				messages: member.messages,
				voiceminutes: member.voiceminutes,
				reactions: member.reactions,
				emojis: member.emojis,
				pictures: member.pictures,
				stickers: member.stickers,

				_messages: member.messages - (member.archieve.length == 0 ? 0 : member.archieve[member.archieve.length - 1]?.messages),
				_voiceminutes: member.voiceminutes - (member.archieve.length == 0 ? 0 : member.archieve[member.archieve.length - 1]?.voiceminutes),
				_reactions: member.reactions - (member.archieve.length == 0 ? 0 : member.archieve[member.archieve.length - 1]?.reactions),
				_emojis: member.emojis - (member.archieve.length == 0 ? 0 : member.archieve[member.archieve.length - 1]?.emojis),
				_pictures: member.pictures - (member.archieve.length == 0 ? 0 : member.archieve[member.archieve.length - 1]?.pictures),
				_stickers: member.stickers - (member.archieve.length == 0 ? 0 : member.archieve[member.archieve.length - 1]?.stickers)
			});
			while (member.archieve.length > 3) {
				member.archieve = member.archieve.slice(1);
			}
			if (member.lvl >= 30) {
				member.lvl = 30;
			} else if (member.lvl >= 20) {
				member.lvl = 20;
			} else if (member.lvl >= 10) {
				member.lvl = 10;
			} else if (member.lvl > 1) {
				member.lvl = 1;
			}
			member.exp = 0;
			this.client.db.set(`lvlsystem_user_${member.id}`, member);
		}
	}

	async sendProfileCard(user_id: string, channel_id: string) {
		if (!user_id || !channel_id) return;
		const channel = await this.client.channels.fetch(channel_id).catch(() => {});
		if (channel && channel.isTextBased()) {
            let profile = await this.getProfileCard(user_id).catch((e) => {
                    this.client.logger.error("[LEVELSYSTEM|SENDPROFILECARD]", e);
                });
            
            if (profile) channel.send({ content: profile.content, components: profile.components, embeds: profile.embeds, files: profile.files });
		}
	}

	async getProfileCard(user_id: string): Promise<InteractionReplyOptions> {
		if (!user_id) return {
			content: "Что-то пошло не так." + "\n" + `Вероятно данный пользователь (<@${user_id}>) не находится на сервере в данный момент.`,
			ephemeral: true
		};
		const profile = await this.get(user_id);

		const guild = await this.client.guilds.fetch(main_guild).catch(() => {});
		if (guild == undefined) return { content: "Что-то пошло не так." + "\n" + `Вероятно данный пользователь (<@${user_id}>) не находится на сервере в данный момент.`, ephemeral: true };
		const member = await guild.members.fetch(user_id).catch(() => {});
		if (member == undefined) return { content: "Что-то пошло не так." + "\n" + `Вероятно данный пользователь (<@${user_id}>) не находится на сервере в данный момент.`, ephemeral: true };
		let _imageBg = `./assets/profile_templates/${profile.profile_type}/blank.png`;
		const _imageOverlay = `./assets/profile_templates/${profile.profile_type}/overlay.png`;
        const _imageAvatar = member.displayAvatarURL({ extension: "png" });
		if (fs.existsSync(`./assets/profile_backgrounds/${user_id}.png`)) _imageBg = `./assets/profile_backgrounds/${user_id}.png`;

		const imageBg = await loadImage(_imageBg).catch(() => {});
		const imageOverlay = await loadImage(_imageOverlay).catch(() => {});
		const imageAvatar = await loadImage(_imageAvatar).catch(() => {});
        
		if (!imageAvatar || !imageOverlay || !imageBg) return { content: "Что-то пошло не так." + "\n" + `Вероятно данный пользователь (<@${user_id}>) не находится на сервере в данный момент.`, ephemeral: true };

		const canvas = createCanvas(400, 200);
		const context = canvas.getContext('2d');
		context.fillStyle = "#23282F";
		context.fillRect(0, 0, 400, 200);

		context.drawImage(imageBg, 0, 0, 400, 200);
		context.drawImage(imageOverlay, 0, 0, 400, 200);

		// Avatar Canvas
		const canvasAvatar = createCanvas(98, 98);
		const contextAvatar = canvasAvatar.getContext('2d');
		contextAvatar.beginPath();
		contextAvatar.arc(98 / 2, 98 / 2, 98 / 2, 0, Math.PI * 2, true); // circle center [x, y], radius
		contextAvatar.closePath();
		contextAvatar.clip();
		if (profile.profile_type == 0) {
			contextAvatar.drawImage(imageBg, 22 - 400, 67 - 200, 98, 98);
		} else if (profile.profile_type == 1) {
			contextAvatar.drawImage(imageBg, 15 - 400, 66 - 200, 87, 87);
		} else if (profile.profile_type == 2) {
			contextAvatar.drawImage(imageBg, 156 - 400, 17 - 200, 87, 87);
		}
		contextAvatar.drawImage(imageAvatar, 0, 0, 98, 98);
		contextAvatar.strokeStyle = "#000";
		contextAvatar.stroke();
		if (profile.profile_type == 0) {
			context.drawImage(canvasAvatar, 22, 67, 98, 98);
		} else if (profile.profile_type == 1) {
			context.drawImage(canvasAvatar, 15, 66, 87, 87);
		} else if (profile.profile_type == 2) {
			context.drawImage(canvasAvatar, 157, 40, 87, 87);
		}

		// User name
		registerFont('./assets/profile_templates/astakhov.ttf', { family: "Astakhov" });
		const title = member.displayName;
		if (profile.profile_type == 0) {
			let i = 24;
			context.font = `${i}pt Astakhov`;
			while (context.measureText(title).width > 355) {
				i--;
				context.font = `${i}pt Astakhov`;
			}
			context.textAlign = 'left';
			context.fillStyle = '#000';
			context.fillText(title, 22, 48);
			context.fillStyle = '#fff';
			context.fillText(title, 20, 46);
		} else if (profile.profile_type == 1) {
			let i = 24;
			context.font = `${i}pt Astakhov`;
			while (context.measureText(title).width > 272) {
				i--;
				context.font = `${i}pt Astakhov`;
			}
			context.textAlign = 'left';
			context.fillStyle = '#000';
			context.fillText(title, 115, 155);
			context.fillStyle = '#fff';
			context.fillText(title, 114, 154);
		} else if (profile.profile_type == 2) {
			let i = 24;
			context.font = `${i}pt Astakhov`;
			while (context.measureText(title).width > 272) {
				i--;
				context.font = `${i}pt Astakhov`;
			}
			context.textAlign = 'center';
			context.fillStyle = '#000';
			context.fillText(title, 202, 167);
			context.fillStyle = '#fff';
			context.fillText(title, 200, 165);
		}

		// Ранг
		if (profile.profile_type == 0) {
			let club = "Новоприбывший";
			if (profile.lvl >= 0) club = "Новоприбывший";
			if (profile.lvl >= 5) club = "Исследователь";
			if (profile.lvl >= 10) club = "Джуниор";
			if (profile.lvl >= 15) club = "Скриптер";
			if (profile.lvl >= 20) club = "Кодер";
			if (profile.lvl >= 30) club = "Программист";
			if (profile.lvl >= 40) club = "Мидл";
			if (profile.lvl >= 50) club = "Эксперт";
			if (profile.lvl == 60) club = "Сеньор";

			context.textAlign = 'left';
			context.font = '10pt Astakhov';
			context.fillStyle = '#000';
			context.fillText(club, 174, 84);
			context.fillStyle = '#fff';
			context.fillText(club, 172, 84);
		}

		// Уровень
		let lvl = `${profile.lvl} LVL`.replace("NaN", "1");
		context.font = '10pt Astakhov';
		context.textAlign = 'center';
		if (profile.profile_type == 0) {
			context.fillStyle = '#000';
			context.fillText(lvl, 73, 185);
			context.fillStyle = '#fff';
			context.fillText(lvl, 71, 183);
		} else if ([1, 2].includes(profile.profile_type)) {
			lvl = `${profile.lvl}`;
			let i = 8;
			context.font = `${i}pt Astakhov`;
			while (context.measureText(lvl).width > 48) {
				i--;
				context.font = `${i}pt Astakhov`;
			}
			context.fillStyle = '#000';
			context.fillText(lvl, 52, 192);
			context.fillStyle = '#fff';
			context.fillText(lvl, 51, 191);
		}

		// Опыт
		if (profile.profile_type == 0) {
			let maxExp = (profile.lvl >= 60 ? 
				(1000 + Math.pow(profile.lvl - 59, 2) * 20) 
				: 1000);
			let exp = `${(profile.exp / 100).toFixed(1).replace(".0", "").replace("NaN", "0")}k/${(maxExp / 100).toFixed(1).replace(".0", "").replace("NaN", "1")}k EXP`;
			context.textAlign = 'right';
			context.fillStyle = '#000';
			context.fillText(exp, 375, 185);
			context.fillStyle = '#fff';
			context.fillText(exp, 373, 183);
			context.fillRect(5, 188, Math.round((profile.exp * 389) / maxExp), 5);
		}

		// VoiceMinutes
		const hrs = `${(profile.voiceminutes / 60).toFixed(1).replace(".0", "").replace("NaN", "0")} Ч`;
		context.font = '10pt Astakhov';
		context.textAlign = 'right';
		if (profile.profile_type == 0) {
			context.fillStyle = '#000';
			context.fillText(hrs, 250, 131);
			context.fillStyle = '#fff';
			context.fillText(hrs, 252, 129);
		} else if ([1, 2].includes(profile.profile_type)) {
			let i = 8;
			context.font = `${i}pt Astakhov`;
			while (context.measureText(hrs).width > 48) {
				i--;
				context.font = `${i}pt Astakhov`;
			}
			context.textAlign = 'center';
			context.fillStyle = '#000';
			context.fillText(hrs, 179, 192);
			context.fillStyle = '#fff';
			context.fillText(hrs, 178, 191);
		}

		// Messages
		let msgs = `${profile.messages}`.replace("NaN", "0");
		context.font = '10pt Astakhov';
		context.textAlign = 'right';
		if (profile.profile_type == 0) {
			context.fillStyle = '#000';
			context.fillText(msgs, 365, 131);
			context.fillStyle = '#fff';
			context.fillText(msgs, 363, 129);
		} else if ([1, 2].includes(profile.profile_type)) {
			let i = 8;
			context.font = `${i}pt Astakhov`;
			while (context.measureText(msgs).width > 48) {
				i--;
				context.font = `${i}pt Astakhov`;
			}
			context.textAlign = 'center';
			context.fillStyle = '#000';
			context.fillText(msgs, 120, 192);
			context.fillStyle = '#fff';
			context.fillText(msgs, 119, 191);
		}

		// Emojis
		if ([1, 2].includes(profile.profile_type)) {
			let emojis = `${profile.emojis + profile.reactions}`.replace("NaN", "0");
			let i = 8;
			context.font = `${i}pt Astakhov`;
			while (context.measureText(emojis).width > 48) {
				i--;
				context.font = `${i}pt Astakhov`;
			}
			context.textAlign = 'center';
			context.fillStyle = '#000';
			context.fillText(emojis, 242, 192);
			context.fillStyle = '#fff';
			context.fillText(emojis, 241, 191);
		}

		// Pictures
		if ([1, 2].includes(profile.profile_type)) {
			let pictures = `${profile.pictures}`.replace("NaN", "0");
			let i = 8;
			context.font = `${i}pt Astakhov`;
			while (context.measureText(pictures).width > 48) {
				i--;
				context.font = `${i}pt Astakhov`;
			}
			context.textAlign = 'center';
			context.fillStyle = '#000';
			context.fillText(pictures, 305, 192);
			context.fillStyle = '#fff';
			context.fillText(pictures, 304, 191);
		}

		// Stickers
		if ([1, 2].includes(profile.profile_type)) {
			let stickers = `${profile.stickers}`.replace("NaN", "0");
			let i = 8;
			context.font = `${i}pt Astakhov`;
			while (context.measureText(stickers).width > 48) {
				i--;
				context.font = `${i}pt Astakhov`;
			}
			context.textAlign = 'center';
			context.fillStyle = '#000';
			context.fillText(stickers, 368, 192);
			context.fillStyle = '#fff';
			context.fillText(stickers, 367, 191);
		}

		// Публикация
		const buffer = canvas.toBuffer('image/png');
		const file1 = new AttachmentBuilder(buffer, { name: `profile_card.png` });
		const embed = new Embed()
			.setTitle(`Профиль`)
			.setDescription(`<@${user_id}>`)
			.setImage(`attachment://profile_card.png`);
		return { embeds: [embed], files: [file1] };
	}

	async getStatsCard(user_id: string): Promise<InteractionReplyOptions> {
		// Проверка вводных данных
		if (!user_id) return {
			content: "Что-то пошло не так." + "\n" + `Вероятно данный пользователь (<@${user_id}>) не находится на сервере в данный момент.`,
			ephemeral: true
		};
		const profile = await this.get(user_id);
		const guild = await this.client.guilds.fetch(main_guild).catch(() => {});
		if (guild == undefined) return { content: "Что-то пошло не так." + "\n" + `Вероятно данный пользователь (<@${user_id}>) не находится на сервере в данный момент.`, ephemeral: true };
		const imageBg = await loadImage(`./assets/profile_templates/graph.png`).catch(() => {});
		if (!imageBg) return { content: "Что-то пошло не так." + "\n" + `Вероятно данный пользователь (<@${user_id}>) не находится на сервере в данный момент.`, ephemeral: true };

		// Подготовка полотна
		const canvas = createCanvas(400, 200);
		const context = canvas.getContext('2d');
		context.fillStyle = '#23282F';
		context.fillRect(0, 0, 400, 200);
		context.drawImage(imageBg, 0, 0, 400, 200);
		registerFont('./assets/profile_templates/astakhov.ttf', { family: "Astakhov" });
		context.font = `7pt Astakhov`;
		context.textAlign = 'center';

		// Числа
		const baseX = 14,
			baseY = 182,
			x = [85, 156, 228, 299],
			maxY = 56;
		let maxLvl = profile.lvl,
			maxMessages = profile.messages,
			maxVoiceMinutes = profile.voiceminutes;
		for (let arch of profile.archieve) {
			if (arch.lvl > maxLvl) maxLvl = arch.lvl;
			if (arch.messages > maxMessages) maxMessages = arch.messages;
			if (arch.voiceminutes > maxVoiceMinutes) maxVoiceMinutes = arch.voiceminutes;
		}
		while (maxLvl % 10 != 0) { maxLvl++; }
		while (profile.archieve.length < 3) {
			profile.archieve = [ {
				lvl: 1,
				exp: 0,
				messages: 0,
				voiceminutes: 0,
				reactions: 0,
				emojis: 0,
				pictures: 0,
				stickers: 0,

				_messages: 0,
				_voiceminutes: 0,
				_reactions: 0,
				_emojis: 0,
				_pictures: 0,
				_stickers: 0
			} ].concat(profile.archieve);
		}
		profile.archieve.push({
			lvl: profile.lvl,
			exp: profile.exp,
			messages: profile.messages,
			voiceminutes: profile.voiceminutes,
			reactions: profile.reactions,
			emojis: profile.emojis,
			pictures: profile.pictures,
			stickers: profile.stickers,

			_messages: profile.messages - (profile.archieve.length == 0 ? 0 : profile.archieve[profile.archieve.length - 1]?.messages),
			_voiceminutes: profile.voiceminutes - (profile.archieve.length == 0 ? 0 : profile.archieve[profile.archieve.length - 1]?.voiceminutes),
			_reactions: profile.reactions - (profile.archieve.length == 0 ? 0 : profile.archieve[profile.archieve.length - 1]?.reactions),
			_emojis: profile.emojis - (profile.archieve.length == 0 ? 0 : profile.archieve[profile.archieve.length - 1]?.emojis),
			_pictures: profile.pictures - (profile.archieve.length == 0 ? 0 : profile.archieve[profile.archieve.length - 1]?.pictures),
			_stickers: profile.stickers - (profile.archieve.length == 0 ? 0 : profile.archieve[profile.archieve.length - 1]?.stickers)
		});

		function drawGraph(context: any, data: ModelArchieve[], lineWidth: number, lineColor: HexColorString, statName: string, maxValue: number, showMaxOnly: boolean) {
			for (let i = 0; i < data.length; i++) {
				context.lineWidth = lineWidth;
				context.strokeStyle = lineColor;
				context.beginPath();
                // @ts-ignore
				context.moveTo(i == 0 ? baseX : x[i - 1], i == 0 ? baseY : baseY - (baseY - maxY) * data[i - 1][statName] / maxValue);
                // @ts-ignore
				context.lineTo(x[i], baseY - (baseY - maxY) * data[i][statName] / maxValue);
				context.stroke();
                // @ts-ignore
				if (((showMaxOnly && data[i][statName] == maxValue) || !showMaxOnly) && data[i][statName] != 0) {
					// Label Canvas
					let size = {
                        // @ts-ignore
						w: context.measureText(`${data[i][statName]}`).width,
						h: 7,
                        // @ts-ignore
						w2: context.measureText(`${data[i][statName]}`).width + 4,
						h2: 9
					}
					const canvasLabel = createCanvas(size.w2, size.h2);
					const contextLabel = canvasLabel.getContext('2d');
					contextLabel.font = `7pt Astakhov`;
					contextLabel.textAlign = 'center';
					contextLabel.fillStyle = '#0C0E14';
					contextLabel.fillRect(0, 0, size.w2, size.h2);

					contextLabel.fillStyle = '#fff';
                    // @ts-ignore
					contextLabel.fillText(`${data[i][statName]}`, size.w2 / 2, size.h2);

					contextLabel.beginPath();
					contextLabel.arc(size.w2 * 0.8, size.w2 / 2, size.h2 / 2, 0, Math.PI * 2, true); // circle center [x, y], radius
					contextLabel.closePath();
					contextLabel.clip();
                    // @ts-ignore
					context.drawImage(canvasLabel, x[i] - size.w2 / 2, baseY - (baseY - maxY) * data[i][statName] / maxValue - 10 - size.h2 / 2, size.w2, size.h2);
				}
			}
		}

		drawGraph(context, profile.archieve, 1, '#67CFDB', '_messages', maxMessages, true);
		drawGraph(context, profile.archieve, 1, '#C65351', '_voiceminutes', maxVoiceMinutes, true);
		drawGraph(context, profile.archieve, 2, '#fff', 'lvl', maxLvl, false);

		context.fillStyle = '#fff';
		context.font = `7pt Astakhov`;
		context.fillText(`Сейчас`, x[3], baseY + 10);
		for (let i = 1; i < x.length; i++) {
			let date = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30 * i).toLocaleString('ru', { month: 'long' });
			context.fillText(date, x[3 - i], baseY + 10);
		}

		// Публикация
		const buffer = canvas.toBuffer('image/png');
		const file1 = new AttachmentBuilder(buffer, { name: `activity_card.png` });
		let voicehours = {
			d: 0,
			h: 0,
			m: profile.voiceminutes
		};
		while (voicehours.m >= 60) {
			voicehours.m -= 60;
			voicehours.h += 1;
			while (voicehours.h >= 24) {
				voicehours.h -= 24;
				voicehours.d += 1;
			}
		}
		const _voicehours = voicehours.d != 0 ? `${voicehours.d} дн. ` : voicehours.h != 0 ? `${voicehours.h} ч. ` : `` + `${voicehours.m} мин.`;
		const embed = new Embed()
			.setTitle(`Активность`)
			.setFields([
				{
					name: `> Уровень`,
					value: `\`\`\`${profile.lvl}\`\`\`<t:${~~(profile.lvl_date / 1000)}:R>`,
					inline: true
				},
				{
					name: `> Сообщений`,
					value: `\`\`\`${profile.messages}\`\`\``,
					inline: true
				},
				{
					name: `> Голос. чаты`,
					value: `\`\`\`${_voicehours}\`\`\``,
					inline: true
				},
				{
					name: `> Реакций`,
					value: `\`\`\`${profile.reactions}\`\`\``,
					inline: true
				},
				{
					name: `> Эмодзи`,
					value: `\`\`\`${profile.emojis}\`\`\``,
					inline: true
				},
				{
					name: `> Вложений`,
					value: `\`\`\`${profile.pictures}\`\`\``,
					inline: true
				},
				{
					name: `> Стикеров`,
					value: `\`\`\`${profile.stickers}\`\`\``,
					inline: true
				}
			])
			.setImage(`attachment://activity_card.png`)
			.setFooter({ text: `🔵 - Сообщения | 🔴 - Голосовые чаты` });
		return { embeds: [embed], files: [file1], ephemeral: true };
	}

	async getProfileInfo(user_id: string): Promise<InteractionReplyOptions> {
		// Проверка вводных данных
		if (!user_id) return {
			content: "Что-то пошло не так." + "\n" + `Вероятно данный пользователь (<@${user_id}>) не находится на сервере в данный момент.`,
			ephemeral: true
		};
		const guild = await this.client.guilds.fetch(main_guild).catch(() => {});
		if (!guild) return { content: "Что-то пошло не так." + "\n" + `Вероятно данный пользователь (<@${user_id}>) не находится на сервере в данный момент.`, ephemeral: true };
		const member = await guild.members.fetch(user_id).catch(() => {});
		if (!member) return { content: "Что-то пошло не так." + "\n" + `Вероятно данный пользователь (<@${user_id}>) не находится на сервере в данный момент.`, ephemeral: true };
		let user = await member.user.fetch(),
			roles = `${member.roles.cache.filter((r) => r.id != guild.id).map((r) => `<@&${r.id}>`).join(',')}`;
		if (roles.length == 0) roles = '-';

		const embed = new Embed()
			.setAuthor({
				name: `${user.username}`,
				url: `https://discordapp.com/users/${user.id}`,
				iconURL: `${user.displayAvatarURL()}`
			})
			.setImage(user.bannerURL({ size: 1024, extension: "gif" }) ?? null)
			.setColor(user.accentColor ?? `#${process.env.EMBED_COLOR}`)
			.setTitle(`Подробная информация`)
			.setFields([
				{
					name: `> Тег`,
					value: `\`\`\`${user.username}#${user.discriminator}\`\`\``,
					inline: true
				},
				{
					name: `> ID`,
					value: `\`\`\`${user.id}\`\`\``,
					inline: true
				},
				{
					name: `> Бот`,
					value: `\`\`\`${user.bot ? "Да" : "Нет"}\`\`\``,
					inline: true
				},
				{
					name: `> Зарегистрирован`,
					value: `<t:${~~(user.createdTimestamp / 1000)}>`,
					inline: true
				},
				{
					name: `> Присоединился`,
					value: `<t:${~~((member.joinedTimestamp ?? Date.now()) / 1000)}>`,
					inline: true
				},
				{
					name: `> Роли`,
					value: roles,
					inline: true
				}
			]);

		if (user.flags && user.flags.toArray().length != 0) embed.addFields({
			name: `> Значки`,
			value: `${user.flags.toArray().map(flag => this.Badges[flag]).join(' ')}`,
			inline: true
		});

		return { embeds: [embed], ephemeral: true };
	}
	
	async getProfileSettings(user_id: string): Promise<InteractionReplyOptions> {
		// Проверка вводных данных
		if (!user_id) return {
			content: "Что-то пошло не так." + "\n" + `Вероятно данный пользователь (<@${user_id}>) не находится на сервере в данный момент.`,
			ephemeral: true
		};
		const profile = await this.get(user_id);
		const guild = await this.client.guilds.fetch(main_guild).catch(() => {});
		if (guild == undefined) return { content: "Что-то пошло не так." + "\n" + `Вероятно данный пользователь (<@${user_id}>) не находится на сервере в данный момент.`, ephemeral: true };
		const member = await guild.members.fetch(user_id).catch(() => {});
		if (member == undefined) return { content: "Что-то пошло не так." + "\n" + `Вероятно данный пользователь (<@${user_id}>) не находится на сервере в данный момент.`, ephemeral: true };

		let optionsProfileTypes = [], optionsColor = [];
		for(let cfgRole of roles_colors) {
            const role = await guild.roles.fetch(cfgRole).catch(() => {});
            if (role) optionsColor.push({
                label: role.name,
                value: cfgRole,
                default: member.roles.cache.has(cfgRole)
            });
		}
		for(let i = 0; i < this.ProfileTypes.length; i++) {
			optionsProfileTypes.push({
				label: `${this.ProfileTypes[i]} [${i}]`,
				value: `${i}`,
				default: profile.profile_type == i
			});
		}
		let buttons: ButtonBuilder[] = [
            new ButtonBuilder()
                .setCustomId('button_profile_bg')
                .setLabel(`Сменить фон профиля`)
                .setStyle(ButtonStyle.Primary)
                .setDisabled(profile.lvl < 60)
        ];
		if (fs.existsSync(`./assets/profile_backgrounds/${user_id}.png`)) {
			buttons.push( 
				new ButtonBuilder()
					.setCustomId("button_profile_bg_delete")
					.setLabel("Установить стандартный фон")
					.setStyle(ButtonStyle.Danger) 
		    );
		}
		if (profile.invited_bot && profile.invited_bot != "undefined") {
			buttons.push( 
				new ButtonBuilder()
					.setCustomId("button_botowners_kick")
					.setLabel("Выгнать ботов")
					.setStyle(ButtonStyle.Danger)
			);
		} else {
			buttons.push( 
				new ButtonBuilder()
					.setCustomId("button_botowners_invite") 
					.setLabel("Пригласить бота")
					.setStyle(ButtonStyle.Primary)
					.setDisabled(profile.lvl < 30)
			);
		}

		return { 	
			embeds: [
				new Embed()
					.setAuthor({
						name: `${member.user.username}`,
						url: `https://discordapp.com/users/${member.id}`,
						iconURL: `${member.displayAvatarURL()}`
					})
					.setTitle("Настройки")
					.setDescription(
						"> **Тип карточки профиля**" + "\n" + 
						`\`\`\`${this.ProfileTypes[profile.profile_type]} [${profile.profile_type}]\`\`\`` + "\n" +
						"> **Приглашенный бот**" + "\n" + 
						(profile.invited_bot == "undefined" ? '```На сервере нет твоих ботов```' : `<@${profile.invited_bot}>`)
					)
			], 
			ephemeral: true,
			components: [
				new ActionRowBuilder<StringSelectMenuBuilder>()
					.addComponents(
						new StringSelectMenuBuilder()
							.setCustomId("select_profile_type")
							.setPlaceholder("Сменить тип профиля")
							.setMinValues(1)
							.setMaxValues(1)
							.addOptions(optionsProfileTypes)
					),
				new ActionRowBuilder<ButtonBuilder>()
					.addComponents(buttons),
				new ActionRowBuilder<StringSelectMenuBuilder>()
					.addComponents(
						new StringSelectMenuBuilder()
                            .setCustomId("select_color_roles")
                            .setMinValues(0)
                            .setMaxValues(1)
                            .setPlaceholder("Выбери цветную роль [LVL 50+]")
                            .setOptions(optionsColor.splice(0, optionsColor.length > 25 ? 25 : optionsColor.length))
							.setDisabled(profile.lvl < 50 && profile.archieve.map((a) => a.lvl >= 50).length == 0)
					)
			] 
		};
	}

	async getWelcomeCard(user_id: string): Promise<void | MessageCreateOptions> {
		if (!user_id) return;
		let profile = await this.client.db.get<ModelUser>(`lvlsystem_user_${user_id}`);

		const guild = await this.client.guilds.fetch(main_guild).catch(() => {});
		if (guild == undefined) return;
		const member = await guild.members.fetch(user_id).catch(() => {});
		if (member == undefined) return;

		let _imageBg = `./assets/profile_templates/1/blank.png`;
        const _imageOverlay = `./assets/welcome/c${Math.floor(Math.random() * 8)}.png`;
		const _imageAvatar = member.displayAvatarURL({ extension: "jpg" });
		if (fs.existsSync(`./assets/profile_backgrounds/${user_id}.png`)) _imageBg = `./assets/profile_backgrounds/${user_id}.png`;

		const imageBg = await loadImage(_imageBg).catch(() => {});
		const imageOverlay = await loadImage(_imageOverlay).catch(() => {});
		const imageAvatar = await loadImage(_imageAvatar).catch(() => {});

		if (!imageBg || !imageOverlay || !imageAvatar) return;

		const canvas = createCanvas(720, 200);
		const context = canvas.getContext('2d');
		context.fillStyle = '#23282F';
		context.fillRect(0, 0, 400, 200);

		context.drawImage(imageBg, 0, 0, 720, 360);
		context.drawImage(imageOverlay, 0, 0, 720, 200);

		// Avatar Canvas
		const canvasAvatar = createCanvas(142, 142);
		const contextAvatar = canvasAvatar.getContext('2d');
		contextAvatar.beginPath();
		contextAvatar.arc(142 / 2, 142 / 2, 142 / 2, 0, Math.PI * 2, true); 
		contextAvatar.closePath();
		contextAvatar.clip();
		contextAvatar.drawImage(imageAvatar, 0, 0, 142, 142);
		contextAvatar.strokeStyle = "#000";
		contextAvatar.stroke();
		context.drawImage(canvasAvatar, 33, 27, 142, 142);

		// User name
		registerFont('./assets/profile_templates/astakhov.ttf', { family: "Astakhov" });
		const title = member.displayName;
		let i = 24;
		context.font = `${i}pt Astakhov`;
		while (context.measureText(title).width > 239) {
			i--;
			context.font = `${i}pt Astakhov`;
		}
		context.textAlign = 'left';
		context.fillStyle = '#000';
		context.fillText(title, 210, 110);
		context.fillStyle = '#fff';
		context.fillText(title, 208, 108);
		
		// Welcome
		context.font = '16pt Astakhov';
		context.fillStyle = '#000';
		context.fillText(`Добро пожаловать`, 210, 50);
		context.fillStyle = '#fff';
		context.fillText(`Добро пожаловать`, 208, 48);

		// Публикация
		const buffer = canvas.toBuffer('image/png');
		const file1 = new AttachmentBuilder(buffer, { name: `welcome_card.png` });
		const embed = new Embed()
			.setDescription(`${member.user.username}(${member}) ${profile == null || profile.lvl == 1  ? 'прибыл' : 'вернулся'} на сервер!`)
			.setImage(`attachment://welcome_card.png`);
		return { content: `${member.user.username}(${member}), ${profile == null || profile.lvl == 1 ? 'добро пожаловать!' : 'с возвращением!'}`, embeds: [embed], files: [file1] };
	}

	async setProfileBackground(user_id: string, url: string): Promise<boolean> {
		if (!user_id) return false;
		let imageBg = await loadImage(url).catch(() => {});
		if (imageBg == undefined) return false;

		const canvas = createCanvas(400, 200);
		const context = canvas.getContext('2d');
		context.fillStyle = '#000000';
		context.fillRect(0, 0, 400, 200);

		let hRatio = canvas.width / imageBg.width,
			vRatio = canvas.height / imageBg.height,
			ratio = Math.max(hRatio, vRatio),
			centerShift_x = (canvas.width - imageBg.width * ratio) / 2,
			centerShift_y = (canvas.height - imageBg.height * ratio) / 2;
		context.clearRect(0, 0, canvas.width, canvas.height);
		context.drawImage(imageBg, 0, 0, imageBg.width, imageBg.height, centerShift_x, centerShift_y, imageBg.width * ratio, imageBg.height * ratio);
		
		// Публикация
		const buffer = canvas.toBuffer('image/png');
		fs.writeFileSync(`./assets/profile_backgrounds/${user_id}.png`, buffer);
		return true;
	}
}
