const { REST, Routes } = require('discord.js');
const { clientId, token } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');

const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
    }
  }
}

async function deployCommands() {
  const rest = new REST({ version: '10' }).setToken(token);
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);
    await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands },
    );
    console.log(`Successfully reloaded application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
}

module.exports = deployCommands;