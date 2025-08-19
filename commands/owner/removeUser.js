const { SlashCommandBuilder } = require("discord.js");
const { Sequelize, DataTypes } = require("sequelize");
const { ownerId } = require("../../config.json");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./database/coins.sqlite",
  logging: false,
});

const Coins = sequelize.define(
  "coins",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.STRING, unique: true },
    username: { type: DataTypes.STRING, allowNull: false },
    amount: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  { timestamps: false, freezeTableName: true }
);

module.exports = {
    data: new SlashCommandBuilder()
        .setName("removeuser")
        .setDescription("Rimuovi un utente dal sistema (Bot owner only)")
        .addStringOption((option) =>
            option.setName("utente").setDescription("L'ID dell'utente da rimuovere").setRequired(true)
        ),
    async execute(interaction) {
        const userId = interaction.options.getString("utente");
        if (interaction.user.id !== ownerId) {
            return interaction.reply({
                content: "Questo comando è riservato al proprietario del bot.",
                ephemeral: true,
            });
        } else {
               try {
            const result = await Coins.destroy({ where: { userId } });
            if (result) {
                return interaction.reply({ content: `Utente con ID ${userId} rimosso con successo.`, ephemeral: true });
            } else {
                return interaction.reply({ content: `Nessun utente trovato con ID ${userId}.`, ephemeral: true });
            }
        } catch (error) {
            console.error("Errore durante la rimozione dell'utente:", error);
            return interaction.reply({ content: "Si è verificato un errore durante la rimozione dell'utente.", ephemeral: true });
        }
        }
    },
};