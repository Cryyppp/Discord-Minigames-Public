const { SlashCommandBuilder } = require("discord.js");
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
  { timestamps: true, freezeTableName: true }
);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("register")
    .setDescription("Registrati per iniziare a guadagnare coin")
    .addStringOption((option) =>
      option
        .setName("username")
        .setDescription("Il nome utente da usare (3-20 caratteri)")
        .setRequired(true)
    ),

  async execute(interaction) {
    const user = interaction.user;
    const username = interaction.options.getString("username")?.trim();

    if (!username || username.length < 3 || username.length > 20) {
      return interaction.reply({
        content: "Il nome utente deve avere tra 3 e 20 caratteri.",
        ephemeral: true,
      });
    }

    try {
      // Assicura che la tabella esista; può essere spostato in init centrale
      await Coins.sync();

      const [record, created] = await Coins.findOrCreate({
        where: { userId: user.id },
        defaults: {
          userId: user.id,
          username,
          amount: 100,
        },
      });

      if (!created) {
        return interaction.reply({
          content: "Sei già registrato.",
          ephemeral: true,
        });
      }

      return interaction.reply({
        content: `Registrazione completata! Benvenuto **${username}**, hai ricevuto 100 coin iniziali.`,
        ephemeral: true,
      });
    } catch (error) {
      console.error("Errore durante la registrazione:", error);
      return interaction.reply({
        content: "Si è verificato un errore durante la registrazione.",
        ephemeral: true,
      });
    }
  },
};
