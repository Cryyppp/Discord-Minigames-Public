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
    .setName("removecoins")
    .setDescription("Rimuovi coin a un utente (Bot owner only)")
    .addStringOption((option) =>
      option.setName("utente").setDescription("ID dell'utente target").setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName("quantità").setDescription("Numero di coin da rimuovere").setRequired(true)
    ),

  async execute(interaction) {
    if (interaction.user.id !== ownerId) {
      return interaction.reply({
        content: "Questo comando è riservato al proprietario del bot.",
        ephemeral: true,
      });
    }

    const userId = interaction.options.getString("utente");
    const amount = interaction.options.getInteger("quantità");

    try {
      const userCoins = await Coins.findOne({ where: { userId } });
      if (!userCoins) {
        return interaction.reply({ content: "Utente non registrato.", ephemeral: true });
      }

      userCoins.amount = Math.max(0, userCoins.amount - amount);
      await userCoins.save();

      return interaction.reply({
        content: `Rimossi ${amount} coin da ${userCoins.username}. Totale: ${userCoins.amount}`,
        ephemeral: true,
      });
    } catch (error) {
      console.error("Errore durante la rimozione dei coin:", error);
      return interaction.reply({
        content: "Si è verificato un errore durante l'operazione.",
        ephemeral: true,
      });
    }
  },
};
