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

    const embed = interaction.message?.embeds?.[0];
    if (!embed) {
      return interaction.reply({ content: "Embed non trovato.", ephemeral: true });
    }

    // estrai ID coinflip dall'embed
    const idField = embed.fields?.find((f) => f.name?.toLowerCase() === "id");
    let coinflipId = null;
    if (idField?.value) {
      const digits = idField.value.replace(/\D/g, "");
      coinflipId = digits ? parseInt(digits, 10) : null;
    }
    if (!coinflipId && embed.description) {
      const match = embed.description.match(/#?(\d{1,})/);
      if (match) coinflipId = parseInt(match[1], 10);
    }
    if (!coinflipId) {
      return interaction.reply({ content: "Nessun coinflip attivo trovato.", ephemeral: true });
    }

    try {
      await sequelize.sync();

      const record = await Coinflip.findOne({ where: { id: coinflipId } });
      if (!record) {
        return interaction.reply({
          content: `Nessun coinflip con ID ${coinflipId} trovato.`,
          ephemeral: true,
        });
      }

      if (record.status !== "pending") {
        return interaction.reply({ content: "Questo coinflip non è più attivo.", ephemeral: true });
      }

      if (record.player1 === interaction.user.id) {
        return interaction.reply({ content: "Non puoi accettare un tuo stesso coinflip.", ephemeral: true });
      }

      if (record.player2) {
        return interaction.reply({ content: "Questo coinflip è già stato accettato.", ephemeral: true });
      }

      // recupera i record coin degli utenti
      const player1Id = record.player1;
      const player2Id = interaction.user.id;

      const user1 = await Coins.findOne({ where: { userId: player1Id } });
      const user2 = await Coins.findOne({ where: { userId: player2Id } });

      if (!user1) {
        return interaction.reply({ content: "Il creatore del coinflip non è registrato o non ha account coin.", ephemeral: true });
      }
      if (!user2) {
        return interaction.reply({ content: "Devi registrarti prima di accettare una scommessa.", ephemeral: true });
      }

      const bet = record.bet;
      if (user1.amount < bet) {
        return interaction.reply({ content: "Il creatore della scommessa non ha abbastanza coin.", ephemeral: true });
      }
      if (user2.amount < bet) {
        return interaction.reply({ content: "Non hai abbastanza coin per accettare questa scommessa.", ephemeral: true });
      }

      // assegna player2 e passa a accepted solo dopo i controlli
      await record.update({ player2: player2Id, status: "accepted" });

      // determina vincitore ed effettua trasferimento
      let winnerId = Math.random() < 0.5 ? player1Id : player2Id;

      if (winnerId === player1Id) {
        user1.amount = (user1.amount || 0) + bet;
        user2.amount = (user2.amount || 0) - bet;
      } else {
        user2.amount = (user2.amount || 0) + bet;
        user1.amount = (user1.amount || 0) - bet;
      }

      await user1.save();
      await user2.save();

      await record.update({ winner: winnerId, status: "completed" });

      const winnerUser = await interaction.client.users.fetch(winnerId).catch(() => null);
      const winnerTag = winnerUser ? winnerUser.tag : `<@${winnerId}>`;

      const resultEmbed = new EmbedBuilder()
        .setTitle("🪙 Coinflip Completato")
        .setDescription(`Il coinflip tra <@${player1Id}> e <@${player2Id}> è terminato!`)
        .addFields(
          { name: "Giocatore 1", value: `<@${player1Id}>`, inline: true },
          { name: "Giocatore 2", value: `<@${player2Id}>`, inline: true },
          { name: "Puntata", value: `${bet} coin`, inline: true },
          { name: "Vincitore", value: winnerTag, inline: true }
        )
        .setColor("#00FF00")
        .setTimestamp();

      return interaction.reply({ embeds: [resultEmbed] });
    } catch (err) {
      console.error("Errore lettura coinflip:", err);
      return interaction.reply({ content: "Errore interno.", ephemeral: true });
    }
  },
};
