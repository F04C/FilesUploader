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

      let uploadedCount = 0;
      const totalFiles = files.length;

      // Initialize progress bar
      let progressBar = '';

      // Update progress bar function
      const updateProgressBar = () => {
        const progress = Math.floor((uploadedCount / totalFiles) * 10);
        const empty = 10 - progress;
        progressBar = '[' + '▓'.repeat(progress) + '░'.repeat(empty) + ']';
      };

      updateProgressBar();

      // Send initial progress message with empty progress bar
      message.channel.send('Uploading files...\n' + progressBar).then(progressMsg => {
        files.forEach(({ file, filePath }) => {
          const fileStats = fs.statSync(filePath);

          // Check file size
          if (fileStats.size > 25 * 1024 * 1024) { // 25MB limit
            console.log(`File ${file} is too large to upload (limit is 25MB).`);
            return; // Skip further processing of this file
          }

          message.channel.send({ files: [filePath] }).then(() => {
            uploadedCount++;

            // Update progress bar
            updateProgressBar();

            // Edit progress message with updated progress bar
            progressMsg.edit('Uploading files...\n' + progressBar);

            if (uploadedCount === totalFiles) {
              message.channel.send('All files have been uploaded.');
            }
          }).catch(error => {
            console.error('Error uploading file:', error);
            message.channel.send(`Failed to upload file ${file}.`);
          });
        });
      });
    });
  }
});

client.login(config.discordToken);
