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

const Daily = sequelize.define(
  "daily",
  {
    userId: { type: DataTypes.STRING, unique: true, primaryKey: true },
    lastClaimed: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
  },
  { timestamps: false, freezeTableName: true }
);

const DAILY_AMOUNT = 100;
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 ore

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dailybonus")
    .setDescription("Ritira il bonus giornaliero di 100 coin (1 volta ogni 24 ore)"),
  async execute(interaction) {
    try {
      await sequelize.sync();

      const userId = interaction.user.id;

      // CHECK: assicurati che l'utente sia registrato
      const registered = await Coins.findOne({ where: { userId } });
      if (!registered) {
        return interaction.reply({
          content: "Devi registrarti prima di usare questo comando. Usa /register <username> per registrarti e ricevere 100 coin.",
          ephemeral: true,
        });
      }

      // trova o crea record cooldown
      const [daily, dailyCreated] = await Daily.findOrCreate({
        where: { userId },
        defaults: { userId, lastClaimed: new Date(0) }, // se nuovo, impostiamo epoca per permettere il claim
      });

      const now = Date.now();
      const last = new Date(daily.lastClaimed).getTime();
      const elapsed = now - last;

      if (elapsed < COOLDOWN_MS) {
        const msLeft = COOLDOWN_MS - elapsed;
        const hours = Math.floor(msLeft / (1000 * 60 * 60));
        const minutes = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((msLeft % (1000 * 60)) / 1000);

        return interaction.reply({
          content: `Hai già ritirato il bonus oggi. Riprova tra ${hours}h ${minutes}m ${seconds}s.`,
          ephemeral: true,
        });
      }

      // prendi il record coins (dato che l'utente è registrato dovrebbe esistere)
      const coinRecord = await Coins.findOne({ where: { userId } });
      if (!coinRecord) {
        // fallback: se per qualche motivo non esiste (coerenza DB), crealo
        await Coins.create({ userId, username: interaction.user.username ?? interaction.user.tag, amount: 0 });
      }

      const record = await Coins.findOne({ where: { userId } });
      record.amount = (record.amount || 0) + DAILY_AMOUNT;
      await record.save();

      daily.lastClaimed = new Date();
      await daily.save();

      const embed = new EmbedBuilder()
        .setTitle("Bonus giornaliero")
        .setDescription(`Hai ricevuto **${DAILY_AMOUNT} coin**!`)
        .addFields({ name: "Totale attuale", value: `${record.amount} coin`, inline: true })
        .setColor("Blue")
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error("Errore /dailybonus:", err);
      return interaction.reply({ content: "Si è verificato un errore. Riprova più tardi.", ephemeral: true });
    }
  },
};