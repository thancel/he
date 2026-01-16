const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const TempVoice = require('../models/TempVoice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tempvoice')
    .setDescription('Setup temporary voice channels')
    .addStringOption(opt =>
      opt.setName('action')
        .setDescription('Action to perform')
        .setRequired(true)
        .addChoices(
          { name: 'Setup', value: 'setup' },
          { name: 'Remove', value: 'remove' }
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction) {
    const action = interaction.options.getString('action');
    
    if (action === 'setup') {
      if (!interaction.member.voice.channel) {
        return interaction.reply({ content: '❌ You must be in a voice channel to set it up!', ephemeral: true });
      }
      
      const channelId = interaction.member.voice.channel.id;
      
      const existing = await TempVoice.findOne({ guildId: interaction.guild.id, channelId });
      if (existing) {
        return interaction.reply({ content: '❌ This channel is already set up!', ephemeral: true });
      }
      
      const tempVoice = new TempVoice({
        guildId: interaction.guild.id,
        channelId
      });
      
      await tempVoice.save();
      
      const embed = new EmbedBuilder()
        .setTitle('✅ Temp Voice Setup')
        .setDescription(`<#${channelId}> is now a temporary voice channel creator!\n\nWhen users join this channel, a new voice channel will be created for them.`)
        .setColor('#00FF00')
        .setFooter({ text: `Setup by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
      
    } else if (action === 'remove') {
      const tempVoice = await TempVoice.findOne({ guildId: interaction.guild.id });
      
      if (!tempVoice) {
        return interaction.reply({ content: '❌ No temp voice setup found!', ephemeral: true });
      }
      
      // Delete all created channels
      for (const channelId of tempVoice.createdChannels) {
        const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);
        if (channel) await channel.delete().catch(() => null);
      }
      
      await TempVoice.deleteOne({ guildId: interaction.guild.id });
      
      const embed = new EmbedBuilder()
        .setTitle('🗑️ Temp Voice Removed')
        .setDescription('Temporary voice channel setup has been removed!')
        .setColor('#FF0000')
        .setFooter({ text: `Removed by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
    }
  }
};