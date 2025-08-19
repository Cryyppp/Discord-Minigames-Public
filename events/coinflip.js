const { Events, EmbedBuilder } = require("discord.js");
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

const Coinflip = sequelize.define(
  "coinflips",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    player1: { type: DataTypes.STRING, allowNull: false },
    player2: { type: DataTypes.STRING, allowNull: true },
    bet: { type: DataTypes.INTEGER, allowNull: false },
    winner: { type: DataTypes.STRING },
    status: { type: DataTypes.STRING, defaultValue: "pending" },
  },
  { timestamps: false, freezeTableName: true }
);

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isButton()) return;
    if (interaction.customId !== "accept_coinflip") return;

    // l'embed è nell'array embeds del messaggio con il pulsante
    const embed = interaction.message?.embeds?.[0];
    if (!embed) {
      return interaction.reply({
        content: "Embed non trovato.",
        ephemeral: true,
      });
    }

    // cerca il field con nome "ID" (case-insensitive)
    const idField = embed.fields?.find((f) => f.name?.toLowerCase() === "id");
    let coinflipId = null;

    if (idField?.value) {
      // rimuove tutto tranne cifre, poi parseInt
      const digits = idField.value.replace(/\D/g, "");
      coinflipId = digits ? parseInt(digits, 10) : null;
    }

    // fallback: prova a cercare un ID nella description (se presente)
    if (!coinflipId && embed.description) {
      const match = embed.description.match(/#?(\d{1,})/);
      if (match) coinflipId = parseInt(match[1], 10);
    }

    if (!coinflipId) {
      return interaction.reply({
        content: "Nessun coinflip attivo trovato",
        ephemeral: true,
      });
    }

    try {
      await sequelize.sync(); // assicura il modello
      const record = await Coinflip.findOne({ where: { id: coinflipId } });
      if (!record) {
        return interaction.reply({
          content: `Nessun coinflip con ID ${coinflipId} trovato.`,
          ephemeral: true,
        });
      }
      if (record.status !== "pending") {
        return interaction.reply({
          content: "Questo coinflip non è più attivo.",
          ephemeral: true,
        });
      }


      const user1 = await Coins.findOne({ where: { userId: record.player1 } });
      const user2 = await Coins.findOne({ where: { userId: interaction.user.id } });

      if (user2.amount < record.bet) {
        return interaction.reply({
          content: "Non hai abbastanza coin per accettare questa scommessa.",
          ephemeral: true,
        });
      }

      await record.update({ player2: interaction.user.id, status: "accepted" });

      const player = record.player1;
      const opponentData = record.player2;

      const winner = Math.random() < 0.5 ? player : opponentData;
      const loser = winner.id === player.id ? opponentData : player;
      const bet = record.bet;

      // Aggiorna i coin
      await Coins.update(
        { amount: Sequelize.literal(`amount + ${bet}`) },
        { where: { userId: winner } }
      );
      await Coins.update(
        { amount: Sequelize.literal(`amount - ${bet}`) },
        { where: { userId: loser } }
      );

      // Messaggio embed di risultato
      const embed = new EmbedBuilder()
        .setTitle("🪙 Coinflip!")
        .setDescription(
          `La sfida tra **${player.id}** e **${opponentData.id}** si è conclusa!\n\n🏆 Vincitore: **${winner.username}**\n💰 Ha vinto **${bet} coin**`
        )
        .setColor("Gold")
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error("Errore lettura coinflip:", err);
      return interaction.reply({ content: "Errore interno.", ephemeral: true });
    }
  },
};
