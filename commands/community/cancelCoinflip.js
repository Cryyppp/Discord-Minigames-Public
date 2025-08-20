const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");
const { Sequelize, DataTypes } = require("sequelize");
const { execute } = require("../minigames/coinflip");

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

const Coinflip = sequelize.define("coinflip", {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  },
  player1: { type: DataTypes.STRING, allowNull: false },
  player2: { type: DataTypes.STRING, allowNull: true },
  bet: { type: DataTypes.INTEGER, allowNull: false },
  winner: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING, defaultValue: "pending" },
});

module.exports = {
    data: new SlashCommandBuilder()
    .setName('cancelcoinflip')
    .setDescription('Annulla un coinflip in corso')
    .addIntegerOption(option =>
        option.setName('id')
            .setDescription('ID del coinflip da annullare')
            .setRequired(true)),

    async execute(interaction) {
        await sequelize.sync();
        const coinflipId = interaction.options.getInteger("id");

        try {
            const record = await Coinflip.findOne({ where: { id: coinflipId } });
            if (!record) {
                return interaction.reply({
                    content: `Nessun coinflip con ID ${coinflipId} trovato.`,
                    ephemeral: true,
                });
            }

            if (record.player1 !== interaction.user.id) {
                return interaction.reply({
                    content: "⚠ Solo il creatore del coinflip può annullarlo.",
                    ephemeral: true,
                });
            }

            await record.destroy();

            return interaction.reply({
                content: `Coinflip con ID ${coinflipId} annullato con successo.`,
                ephemeral: true,
            });
        } catch (err) {
            console.error("Errore lettura coinflip:", err);
            return interaction.reply({ content: "Errore interno.", ephemeral: true });
        }
    }
}