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
      if(interaction.user.id === record.player1) {
        return interaction.reply({ content: "Non puoi accettare un tuo stesso coinflip", ephemeral: true });
      }
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
      try {
        const user2 = await Coins.findOne({ where: { userId: interaction.user.id } });
        if (!user2) {
          return interaction.reply({
            content: "⚠ Devi registrarti prima di usare questo comando.",
            ephemeral: true,
          });
        }
      } catch (error) {
        console.error("Errore nel recupero dell'utente 2:", error);
        return interaction.reply({ content: "Errore interno.", ephemeral: true });
      }
      await record.update({ player2: interaction.user.id, status: "accepted" });

      const player1 = record.player1;
      const player2 = record.player2;
      const bet = record.bet;

      // verifica che entrambi abbiano abbastanza coin
      if (user1.amount < bet) {
        return interaction.reply({ content: "Il giocatore che ha creato la scommessa non ha abbastanza coin.", ephemeral: true });
      }
      if (user2.amount < bet) {
        return interaction.reply({ content: "Non hai abbastanza coin per accettare questa scommessa.", ephemeral: true });
      }

      // determina vincitore e perdente usando gli id
      const winnerId = Math.random() < 0.5 ? player1 : player2;
      const loserId = winnerId === player1 ? player2 : player1;

      // applica trasferimento: il vincitore guadagna la puntata, il perdente la perde
      const winnerRecord = winnerId === user1.userId ? user1 : user2;
      const loserRecord = loserId === user1.userId ? user1 : user2;

      winnerRecord.amount = (winnerRecord.amount || 0) + bet;
      loserRecord.amount = (loserRecord.amount || 0) - bet;

      await winnerRecord.save();
      await loserRecord.save();

      await record.update({ winner: winnerId, status: "completed" });

      // tenta di recuperare il tag dell'utente per una risposta più leggibile
      const winnerUser = await interaction.client.users.fetch(winnerId).catch(() => null);
      const winnerTag = winnerUser ? winnerUser.tag : winnerId;

      const embed = new EmbedBuilder()
        .setTitle("🪙 Coinflip Completato")
        .setDescription(`Il coinflip tra <@${user1.id}> e <@${user2.id}> è terminato!`)
        .addFields(
          { name: "Giocatore 1", value: `<@${user1.id}>`, inline: true },
          { name: "Giocatore 2", value: `<@${user2.id}>`, inline: true },
          { name: "Puntata", value: `${bet} coin`, inline: true },
          { name: "Vincitore", value: winnerTag, inline: true }
        )
        .setColor("#00FF00");

      return interaction.reply({ embeds: [embed] });

      //return interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error("Errore lettura coinflip:", err);
      return interaction.reply({ content: "Errore interno.", ephemeral: true });
    }
  },
};
