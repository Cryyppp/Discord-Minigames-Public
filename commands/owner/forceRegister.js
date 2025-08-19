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
  { timestamps: true, freezeTableName: true }
);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("forceregister")
    .setDescription("Registra forzatamente un utente nel DB (Bot owner only)")
    .addStringOption((option) =>
      option.setName("utente").setDescription("ID dell'utente da registrare").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("username").setDescription("Username da salvare (opzionale)").setRequired(false)
    )
    .addIntegerOption((option) =>
      option.setName("quantità").setDescription("Quantità iniziale di coin (default 100)").setRequired(false)
    ),

  async execute(interaction) {
    if (interaction.user.id !== ownerId) {
      return interaction.reply({ content: "Questo comando è riservato al proprietario del bot.", ephemeral: true });
    }

    const userId = interaction.options.getString("utente").trim();
    const usernameOpt = interaction.options.getString("username");
    const amountOpt = interaction.options.getInteger("quantità");
    const amount = typeof amountOpt === "number" ? amountOpt : 100;
    const username = usernameOpt ? usernameOpt.trim() : `User-${userId}`;

    if(interaction.user.id === ownerId) {
      await Coins.sync();

      const existing = await Coins.findOne({ where: { userId } });
      if (existing) {
        return interaction.reply({ content: `Utente già registrato come **${existing.username}** (ID: ${userId}).`, ephemeral: true });
      }

      await Coins.create({
        userId,
        username,
        amount,
      });

      return interaction.reply({
        content: `✅ Utente registrato: **${username}** (ID: ${userId}) con **${amount} coin**.`,
        ephemeral: true,
      });
    }
  },
}