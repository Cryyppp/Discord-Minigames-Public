const { Events, EmbedBuilder } = require("discord.js");

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isModalSubmit()) return;

        const { customId } = interaction;

        if (customId === "annuncio_modal") {
            const title = interaction.fields.getTextInputValue("annuncio_title");
            const content = interaction.fields.getTextInputValue("annuncio_input");

            const guilds = interaction.client.guilds.cache;

            let successCount = 0;
            let failCount = 0;

            for (const [guildId, guild] of guilds) {
                try {
                    const owner = await guild.fetchOwner();

                    const embed = new EmbedBuilder()
                        .setTitle(title)
                        .setDescription(content)
                        .setColor("Blue")
                        .setFooter({ text: `Annuncio inviato al proprietario del server: ${guild.name}` })
                        .setTimestamp();

                    await owner.send({ embeds: [embed] });
                    successCount++;
                } catch (err) {
                    console.warn(`❌ Impossibile inviare DM a ${guild.name} (${guild.id}):`, err.message);
                    failCount++;
                }
            }

            await interaction.reply({
                content: `✅ Annuncio inviato a **${successCount} owner**.\n❌ Fallito in **${failCount} server** (DM disattivati o errore).`,
                ephemeral: true
            });
        }
    }
};
