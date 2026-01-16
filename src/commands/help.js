const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('View all available commands'),
  async execute(interaction, client) {
    const categories = {
      moderation: {
        emoji: '🛡️',
        name: 'Moderation',
        commands: [
          { name: '/kick', description: 'Kick a member from the server' },
          { name: '/ban', description: 'Ban a member (with optional duration)' },
          { name: '/unban', description: 'Unban a user by ID' },
          { name: '/mute', description: 'Timeout a member' },
          { name: '/unmute', description: 'Remove timeout from member' }
        ]
      },
      fun: {
        emoji: '🎉',
        name: 'Fun',
        commands: [
          { name: '/say', description: 'Make the bot say something' }
        ]
      },
      giveaway: {
        emoji: '🎁',
        name: 'Giveaway',
        commands: [
          { name: '/ga start', description: 'Start a new giveaway' },
          { name: '/ga end', description: 'End a giveaway early' },
          { name: '/ga list', description: 'List active giveaways' }
        ]
      },
      currency: {
        emoji: '💰',
        name: 'Currency',
        commands: [
          { name: '/balance', description: 'Check your or someone\'s balance' },
          { name: '/daily', description: 'Claim daily reward with streak' },
          { name: '/coinflip', description: 'Play coinflip minigame' },
          { name: '/slot', description: 'Play slot machine' },
          { name: '/give', description: 'Give currency to another user' }
        ]
      },
      animanga: {
        emoji: '📺',
        name: 'Anime & Manga',
        commands: [
          { name: '/anime', description: 'Search anime info from AniList' },
          { name: '/manga', description: 'Search manga info from AniList' }
        ]
      },
      voice: {
        emoji: '🎤',
        name: 'Voice',
        commands: [
          { name: '/tempvoice setup', description: 'Setup temp voice channel' },
          { name: '/tempvoice remove', description: 'Remove temp voice setup' }
        ]
      },
      system: {
        emoji: '⚙️',
        name: 'System',
        commands: [
          { name: '/host', description: 'View host statistics (Owner only)' },
          { name: '/help', description: 'Show this help menu' }
        ]
      }
    };
    
    const mainEmbed = new EmbedBuilder()
      .setTitle('📚 Help Menu')
      .setDescription('Select a category below to view commands!')
      .setColor('#5865F2')
      .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();
    
    const options = Object.entries(categories).map(([key, cat]) => ({
      label: cat.name,
      description: `View ${cat.name} commands`,
      value: key,
      emoji: cat.emoji
    }));
    
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`help_${interaction.user.id}`)
      .setPlaceholder('Select a category')
      .addOptions(options);
    
    const row = new ActionRowBuilder().addComponents(selectMenu);
    
    await interaction.reply({ embeds: [mainEmbed], components: [row] });
    
    const collector = interaction.channel.createMessageComponentCollector({
      filter: i => i.customId === `help_${interaction.user.id}` && i.user.id === interaction.user.id,
      time: 60000
    });
    
    collector.on('collect', async i => {
      const category = categories[i.values[0]];
      
      const embed = new EmbedBuilder()
        .setTitle(`${category.emoji} ${category.name} Commands`)
        .setDescription(category.commands.map(cmd => `**${cmd.name}**\n${cmd.description}`).join('\n\n'))
        .setColor('#5865F2')
        .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();
      
      await i.update({ embeds: [embed], components: [row] });
    });
    
    collector.on('end', () => {
      interaction.editReply({ components: [] }).catch(() => null);
    });
  }
};