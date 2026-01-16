import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createEmbed, getRandomColor } from '../../utils/embedBuilder.js';
import TempVoice from '../../models/TempVoice.js';

export default {
  data: new SlashCommandBuilder()
    .setName('tempvoice')
    .setDescription('Setup or remove temporary voice channel')
    .addStringOption(option =>
      option
        .setName('action')
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
      await handleSetup(interaction);
    } else if (action === 'remove') {
      await handleRemove(interaction);
    }
  }
};

async function handleSetup(interaction) {
  const member = interaction.member;

  if (!member.voice.channel) {
    return interaction.reply({
      content: '❌ You must be in a voice channel to set it up as temp voice!',
      ephemeral: true
    });
  }

  const channelId = member.voice.channelId;

  const existingSetup = await TempVoice.findOne({ guildId: interaction.guild.id });

  if (existingSetup) {
    return interaction.reply({
      content: '❌ A temporary voice channel is already setup in this server! Remove it first.',
      ephemeral: true
    });
  }

  await TempVoice.create({
    guildId: interaction.guild.id,
    channelId: channelId,
    createdChannels: []
  });

  const embed = createEmbed({
    title: '✅ Temporary Voice Setup',
    description: `Successfully setup <#${channelId}> as temporary voice creator!\n\nWhen users join this channel, a temporary voice channel will be created for them.`,
    color: getRandomColor()
  });

  await interaction.reply({ embeds: [embed] });
}

async function handleRemove(interaction) {
  const existingSetup = await TempVoice.findOne({ guildId: interaction.guild.id });

  if (!existingSetup) {
    return interaction.reply({
      content: '❌ No temporary voice channel setup found in this server!',
      ephemeral: true
    });
  }

  // Delete all created temp channels
  for (const channelId of existingSetup.createdChannels) {
    try {
      const channel = await interaction.guild.channels.fetch(channelId);
      if (channel) await channel.delete();
    } catch (error) {
      console.error(`Error deleting temp channel ${channelId}:`, error);
    }
  }

  await TempVoice.deleteOne({ guildId: interaction.guild.id });

  const embed = createEmbed({
    title: '✅ Temporary Voice Removed',
    description: 'Successfully removed temporary voice setup and deleted all created channels.',
    color: getRandomColor()
  });

  await interaction.reply({ embeds: [embed] });
}