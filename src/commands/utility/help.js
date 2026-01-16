import { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } from 'discord.js';
import { createEmbed, getRandomColor } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('View all available commands'),

  async execute(interaction) {
    const categories = {
      moderation: {
        name: '🛡️ Moderation',
        commands: [
          { name: 'kick', description: 'Kick a member from the server' },
          { name: 'ban', description: 'Ban a member from the server' },
          { name: 'mute', description: 'Mute a member in the server' },
          { name: 'unban', description: 'Unban a user from the server' },
          { name: 'unmute', description: 'Unmute a member in the server' }
        ]
      },
      fun: {
        name: '🎮 Fun',
        commands: [
          { name: 'say', description: 'Make the bot say something' }
        ]
      },
      giveaway: {
        name: '🎉 Giveaway',
        commands: [
          { name: 'ga start', description: 'Start a new giveaway' },
          { name: 'ga end', description: 'End a giveaway immediately' },
          { name: 'ga list', description: 'List all active giveaways' }
        ]
      },
      currency: {
        name: '💰 Currency',
        commands: [
          { name: 'balance', description: 'Check your or someone else\'s balance' },
          { name: 'daily', description: 'Claim your daily credits' },
          { name: 'coinflip', description: 'Play coinflip game' },
          { name: 'slot', description: 'Play slot machine game' },
          { name: 'give', description: 'Give credits to another user' }
        ]
      },
      animanga: {
        name: '📺 Anime & Manga',
        commands: [
          { name: 'anime', description: 'Search for anime information' },
          { name: 'manga', description: 'Search for manga information' }
        ]
      },
      voice: {
        name: '🔊 Voice',
        commands: [
          { name: 'tempvoice', description: 'Setup or remove temporary voice channel' }
        ]
      },
      utility: {
        name: '🔧 Utility',
        commands: [
          { name: 'host', description: 'View host statistics (Owner only)' },
          { name: 'help', description: 'View all available commands' }
        ]
      }
    };

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('help_select')
      .setPlaceholder('Select a category')
      .addOptions(
        Object.entries(categories).map(([key, cat]) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(cat.name)
            .setDescription(`View ${key} commands`)
            .setValue(key)
        )
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const mainEmbed = createEmbed({
      title: '📚 Help Menu',
      description: 'Select a category from the dropdown below to view commands.',
      fields: Object.values(categories).map(cat => ({
        name: cat.name,
        value: `${cat.commands.length} command(s)`,
        inline: true
      })),
      color: getRandomColor()
    });

    const message = await interaction.reply({
      embeds: [mainEmbed],
      components: [row],
      fetchReply: true
    });

    const collector = message.createMessageComponentCollector({
      time: 120000
    });

    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({
          content: '❌ This is not your help menu!',
          ephemeral: true
        });
      }

      const selectedCategory = i.values[0];
      const category = categories[selectedCategory];

      const categoryEmbed = createEmbed({
        title: category.name,
        description: category.commands.map(cmd => 
          `**/${cmd.name}**\n${cmd.description}`
        ).join('\n\n'),
        color: getRandomColor()
      });

      await i.update({ embeds: [categoryEmbed] });
    });

    collector.on('end', async () => {
      try {
        await interaction.editReply({ components: [] });
      } catch (error) {
        // Message might be deleted
      }
    });
  }
};