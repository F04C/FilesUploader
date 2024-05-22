const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

const commands = [
  {
    name: 'upload',
    description: 'Upload files from a specified folder',
    options: [
      {
        name: 'path',
        type: 3, // STRING type
        description: 'The folder path to upload files from',
        required: true
      }
    ]
  }
];

const rest = new REST({ version: '9' }).setToken(config.discordToken);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(client.user.id, 'your_guild_id'),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;

  if (commandName === 'upload') {
    const folderPath = options.getString('path');

    if (!folderPath) {
      return interaction.reply('Please provide a folder path.');
    }

    fs.readdir(folderPath, (err, files) => {
      if (err) {
        console.error('Error reading the folder:', err);
        return interaction.reply('Error reading the folder.');
      }

      if (files.length === 0) {
        return interaction.reply('The folder is empty.');
      }

      // Sort files by creation time (oldest first)
      files = files.map(file => {
        const filePath = path.join(folderPath, file);
        const stat = fs.statSync(filePath);
        return { file, filePath, birthtime: stat.birthtime };
      }).sort((a, b) => a.birthtime - b.birthtime);

      let uploadedCount = 0;
      const totalFiles = files.length;

      files.forEach(({ file, filePath }) => {
        const fileStats = fs.statSync(filePath);

        // Check file size
        if (fileStats.size > 25 * 1024 * 1024) { // 25MB limit
          return interaction.reply(`File ${file} is too large to upload (limit is 25MB).`);
        }

        interaction.deferReply().then(() => {
          message.channel.send({ files: [filePath] }).then(() => {
            uploadedCount++;
            const progress = ((uploadedCount / totalFiles) * 100).toFixed(2);
            if (uploadedCount === totalFiles) {
              interaction.editReply(`All files have been uploaded. Upload progress: ${progress}%`);
            }
          }).catch(error => {
            console.error('Error uploading file:', error);
            interaction.editReply(`Failed to upload file ${file}.`);
          });
        });
      });
    });
  }
});

client.login(config.discordToken);
