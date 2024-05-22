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
    const args = message.content.split(' ');
    const folderPath = args[1];

    if (!folderPath) {
      return message.channel.send('Please provide a folder path.');
    }

    fs.readdir(folderPath, (err, files) => {
      if (err) {
        console.error('Error reading the folder:', err);
        return message.channel.send('Error reading the folder.');
      }

      if (files.length === 0) {
        return message.channel.send('The folder is empty.');
      }

      // Sort files by creation time (oldest first)
      files = files.map(file => {
        const filePath = path.join(folderPath, file);
        const stat = fs.statSync(filePath);
        return { file, filePath, birthtime: stat.birthtime };
      }).sort((a, b) => a.birthtime - b.birthtime);

      files.forEach(({ file, filePath }) => {
        const fileStats = fs.statSync(filePath);

        // Check file size
        if (fileStats.size > 25 * 1024 * 1024) { // 25MB limit
          return message.channel.send(`File ${file} is too large to upload (limit is 25MB).`);
        }

        message.channel.send({ files: [filePath] }).catch(error => {
          console.error('Error uploading file:', error);
          message.channel.send(`Failed to upload file ${file}.`);
        });
      });
    });
  }
});

client.login(config.discordToken);
