import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { REST, Routes } from 'discord.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function loadCommands(client) {
  const commands = [];
  const commandsPath = join(__dirname, '../commands');
  const commandFolders = readdirSync(commandsPath);

  for (const folder of commandFolders) {
    const folderPath = join(commandsPath, folder);
    const commandFiles = readdirSync(folderPath).filter(f => f.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = join(folderPath, file);
      const fileUrl = pathToFileURL(filePath).href;
      
      try {
        const command = await import(fileUrl);
        
        if (command.default?.data && command.default?.execute) {
          client.commands.set(command.default.data.name, command.default);
          commands.push(command.default.data.toJSON());
          console.log(`✅ Loaded command: ${command.default.data.name}`);
        }
      } catch (error) {
        console.error(`❌ Error loading command ${file}:`, error);
      }
    }
  }

  const rest = new REST().setToken(process.env.DISCORD_TOKEN);
  
  try {
    console.log(`🔄 Refreshing ${commands.length} slash commands...`);
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log('✅ Successfully registered slash commands');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
}