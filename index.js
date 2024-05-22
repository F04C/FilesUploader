const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits } = require('discord.js');
const config = require('./config');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.once('ready', () => {
  console.log('Bot is ready!');
});

client.on('messageCreate', async (message) => {
  if (message.content.startsWith('!upload')) {
    const folderPath = message.content.split(' ')[1];

    if (!folderPath) {
      return message.channel.send('Please provide a folder path.');
    }

    fs.readdir(folderPath, (err, files) => {
      if (err) {
        return message.channel.send('Error reading the folder.');
      }

      files.forEach((file) => {
        const filePath = path.join(folderPath, file);
        message.channel.send({ files: [filePath] }).catch(console.error);
      });
    });
  }
});

client.login(config.discordToken);
