const fs = require("node:fs");
const path = require("node:path");
const { Client, Collection, GatewayIntentBits } = require("discord.js");
const { token } = require("./config.json");
const { ActivityType } = require("discord.js");
const deployCommands = require("./deploycommands.js");
const {Sequelize, DataTypes} = require("sequelize");


const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

// Array con opzioni di status e tipo attività
const statusOptions = [
  {
    text: () => `${client.guilds.cache.size} salegiochi`,
    type: ActivityType.Watching,
  },
  {
    text: () => {
      // Somma tutti i membri di tutte le guild
      const totalMembers = client.guilds.cache.reduce(
        (acc, guild) => acc + guild.memberCount,
        0
      );
      return `${totalMembers} gamers`;
    },
    type: ActivityType.Watching,
  },
];



const sequelize = new Sequelize("database", "username", "password", {
  host: "localhost",
  dialect: "sqlite",
  logging: false,
  storage: "./database/coins.sqlite",
});

const Coins = sequelize.define("coins", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.STRING,
    unique: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
});


client.on("ready", () => {
  // Funzione per aggiornare lo status
  const updateStatus = () => {
    const randomStatus =
      statusOptions[Math.floor(Math.random() * statusOptions.length)];
    const statusText =
      typeof randomStatus.text === "function"
        ? randomStatus.text()
        : randomStatus.text;
    client.user.setActivity(statusText, { type: randomStatus.type });
  };
  updateStatus();

  setInterval(updateStatus, 10000);
  deployCommands();
  Coins.sync({ alter: true });

});

client.login(token);
