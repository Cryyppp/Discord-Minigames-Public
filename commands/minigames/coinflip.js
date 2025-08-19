const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");
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
    .setName("coinflip")
    .setDescription("Crea un coinflip")
    .addIntegerOption((option) =>
      option
        .setName("puntata")
        .setDescription("La quantità di monete da scommettere")
        .setRequired(true)
    ),

  async execute(interaction) {
    await sequelize.sync();
    const bet = interaction.options.getInteger("puntata");

    try {
      // Recupera i dati dal DB
      const player = await Coins.findOne({
        where: { userId: interaction.user.id },
      });

      if (!player) {
        return interaction.reply({
          content:
            "⚠ Devi registrarti prima di usare questo comando. Usa `/register <username>` per registrarti e ricevere 100 coin.",
          ephemeral: true,
        });
      }

      if (player.amount < bet) {
        return interaction.reply({
          content: "❌ Non hai abbastanza coin per questa scommessa!",
          ephemeral: true,
        });
      }

      try {
        const existingCoinflip = await Coinflip.findOne({
          where: {
            player1: interaction.user.id,
            status: "pending",
          },
        });

        if (existingCoinflip) {
          return interaction.reply({
            content: "⚠ Hai già un coinflip in corso!",
            ephemeral: true,
          });
        }

        coinflip = await Coinflip.create({
          player1: interaction.user.id,
          bet: bet,
          status: "pending",
        });

        const embedCf = new EmbedBuilder()
          .setTitle("🪙 Coinflip Creato")
          .setDescription(
            `Un nuovo coinflip è stato creato dal valore di **${bet} coin**!`
          )
          .addFields(
            {
              name: "Giocatore 1",
              value: interaction.user.username,
              inline: true,
            },
            { name: "Puntata", value: `${bet} coin`, inline: true },
            { name: "ID", value: `${coinflip.id}`, inline: true }
          )
          .setColor("Blue")
          .setTimestamp();

        // Pulsante accetta
        const accettaBtn = new ButtonBuilder()
          .setCustomId("accept_coinflip")
          .setLabel("Accetta Coinflip")
          .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder().addComponents(accettaBtn);

        await interaction.reply({ embeds: [embedCf], components: [row] });
      } catch (error) {
        console.error("Errore nel salvataggio del coinflip:", error);
        return interaction.reply(
          "❌ Si è verificato un errore nel creare il coinflip."
        );
      }
    } catch (error) {
      console.error("Errore nel comando coinflip:", error);
      return interaction.reply(
        "❌ Si è verificato un errore nell'esecuzione del comando."
      );
    }
  },
};
