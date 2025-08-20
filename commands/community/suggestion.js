const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { ownerId } = require("../../config.json");

const COOLDOWN_MS = 60 * 1000 * 60 * 24; // 24h
const cooldowns = new Map();

module.exports = {
    cooldown: COOLDOWN_MS,
    data: new SlashCommandBuilder()
        .setName('suggestion')
        .setDescription('Invia una suggerimento')
        .addStringOption(option =>
            option.setName('testo')
                .setDescription('Il testo del suggerimento')
                .setRequired(true)),
    async execute(interaction) {
        const userId = interaction.user.id;
        const now = Date.now();
        const last = cooldowns.get(userId) ?? 0;
        const elapsed = now - last;

        if (elapsed < COOLDOWN_MS) {
            const msLeft = COOLDOWN_MS - elapsed;
            const seconds = Math.ceil(msLeft / 1000);
            return interaction.reply({ content: `Puoi inviare solo un suggerimento al giorno`, ephemeral: true });
        }

        // imposta cooldown e pulizia automatica
        cooldowns.set(userId, now);
        setTimeout(() => cooldowns.delete(userId), COOLDOWN_MS);

        const owner = interaction.client.users.cache.get(ownerId);
        const suggestionText = interaction.options.getString('testo');
        const embedsuggestion = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Nuovo Suggerimento')
            .setDescription(suggestionText)
            .setTimestamp()
            .setFooter({ text: 'Suggerimenti', iconURL: interaction.user.displayAvatarURL() });

        if (owner) await owner.send({ embeds: [embedsuggestion] }).catch(() => { /* ignore DM errors */ });
        await interaction.reply({ content: `Suggerimento inviato: ${suggestionText}`, ephemeral: true });
    }
}