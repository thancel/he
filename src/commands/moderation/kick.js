import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createEmbed, getRandomColor } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server')
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('The member to kick')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for kicking')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    const target = interaction.options.getMember('target');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!target) {
      return interaction.reply({
        content: '❌ User not found in this server!',
        ephemeral: true
      });
    }

    if (target.id === interaction.user.id) {
      return interaction.reply({
        content: '❌ You cannot kick yourself!',
        ephemeral: true
      });
    }

    if (target.roles.highest.position >= interaction.member.roles.highest.position) {
      return interaction.reply({
        content: '❌ You cannot kick this user! They have higher or equal role.',
        ephemeral: true
      });
    }

    if (!target.kickable) {
      return interaction.reply({
        content: '❌ I cannot kick this user!',
        ephemeral: true
      });
    }

    try {
      await target.kick(reason);

      const embed = createEmbed({
        title: '👢 Member Kicked',
        description: `**${target.user.tag}** has been kicked from the server!`,
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
        content: '❌ Failed to kick the user!',
        ephemeral: true
      });
    }
  }
};