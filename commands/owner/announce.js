const {
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
} = require("discord.js");

const { ownerId } = require("../../config.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("announce")
        .setDescription("Avvia un annuncio in tutti i server (Bot owner only)"),

    async execute(interaction) {
        if (interaction.user.id !== ownerId) {
            return interaction.reply({
                content: "Questo comando è riservato al proprietario del bot.",
                ephemeral: true,
            });
        }

        // Crea i componenti del modal
        const titleInput = new TextInputBuilder()
            .setCustomId("annuncio_title")
            .setLabel("Titolo dell'annuncio:")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const bodyInput = new TextInputBuilder()
            .setCustomId("annuncio_input")
            .setLabel("Il tuo annuncio:")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);
            
        const modal = new ModalBuilder()
            .setCustomId("annuncio_modal")
            .setTitle("Annuncio")
            .addComponents(
                new ActionRowBuilder().addComponents(titleInput),
                new ActionRowBuilder().addComponents(bodyInput)
            );

        await interaction.showModal(modal);
    },
};
