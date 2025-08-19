const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { Sequelize, DataTypes } = require("sequelize");

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
    .setName("baltop")
    .setDescription("Mostra la classifica utenti con più coin")
    .addIntegerOption((opt) =>
      opt
        .setName("limit")
        .setDescription("Quanti utenti mostrare (default 10, max 25)")
        .setMinValue(1)
        .setMaxValue(25)
    ),
  async execute(interaction) {
    await Coins.sync(); // assicura che il modello punti al DB
    const limit = interaction.options.getInteger("limit") ?? 10;

    const rows = await Coins.findAll({
      order: [["amount", "DESC"]],
      limit,
    });

    if (!rows.length) {
      return interaction.reply({ content: "Nessun dato disponibile.", ephemeral: true });
    }

    const description = rows
      .map((r, i) => {
        const name = r.username ?? r.userId;
        return `**${i + 1}. ${name}** — ${r.amount} coins`;
      })
      .join("\n");

    const embed = new EmbedBuilder()
      .setTitle("BALTOP — Top coins")
      .setDescription(description)
      .setColor("Blue")
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};