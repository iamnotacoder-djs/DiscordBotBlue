import { APIEmbed, EmbedBuilder, EmbedData } from "discord.js";

export default class Embed extends EmbedBuilder {

    constructor(description?: string, data?: EmbedData | APIEmbed) {
        super(data);
        this.setColor(`#${process.env.EMBED_COLOR}`);
        if (description) this.setDescription(description);
    }
}