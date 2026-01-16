import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createEmbed, getRandomColor } from '../../utils/embedBuilder.js';
import Mute from '../../models/Mute.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Unmute a member in the server')
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('The member to unmute')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for unmuting')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getMember('target');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!target) {
      return interaction.reply({
        content: '❌ User not found in this server!',
        ephemeral: true
      });
    }

    if (!target.isCommunicationDisabled()) {
      return interaction.reply({
        content: '❌ This user is not muted!',
        ephemeral: true
      });
    }

    try {
      await target.timeout(null, reason);
      
      await Mute.deleteOne({
        userId: target.id,
        guildId: interaction.guild.id
      });

      const embed = createEmbed({
        title: '🔊 Member Unmuted',
        description: `**${target.user.tag}** has been unmuted successfully!`,
        fields: [
          { name: '👤 User', value: `${target.user.tag} (${target.id})`, inline: true },
          { name: '🛡️ Moderator', value: interaction.user.tag, inline: true },
          { name: '📝 Reason', value: reason, inline: false }
        ],
        color: getRandomColor()
      });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: '❌ Failed to unmute the user!',
        ephemeral: true
      });
    }
  }
};