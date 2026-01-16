import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createEmbed, getRandomColor } from '../../utils/embedBuilder.js';
import ms from 'ms';

export default {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server')
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('The member to ban')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('duration')
        .setDescription('Duration of ban (e.g., 1d, 1h, 1m) - Leave empty for permanent')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for banning')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const target = interaction.options.getMember('target');
    const durationStr = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!target) {
      return interaction.reply({
        content: '❌ User not found in this server!',
        ephemeral: true
      });
    }

    if (target.id === interaction.user.id) {
      return interaction.reply({
        content: '❌ You cannot ban yourself!',
        ephemeral: true
      });
    }

    if (target.roles.highest.position >= interaction.member.roles.highest.position) {
      return interaction.reply({
        content: '❌ You cannot ban this user! They have higher or equal role.',
        ephemeral: true
      });
    }

    if (!target.bannable) {
      return interaction.reply({
        content: '❌ I cannot ban this user!',
        ephemeral: true
      });
    }

    let duration = null;
    let durationText = 'Permanent';

    if (durationStr) {
      duration = ms(durationStr);
      if (!duration) {
        return interaction.reply({
          content: '❌ Invalid duration format! Use formats like: 1d, 1h, 1m, 1s',
          ephemeral: true
        });
      }
      durationText = ms(duration, { long: true });
    }

    try {
      await target.ban({ reason });

      if (duration) {
        setTimeout(async () => {
          try {
            await interaction.guild.members.unban(target.id);
          } catch (error) {
            console.error('Error unbanning user:', error);
          }
        }, duration);
      }

      const embed = createEmbed({
        title: '🔨 Member Banned',
        description: `**${target.user.tag}** has been banned from the server!`,
        fields: [
          { name: '👤 User', value: `${target.user.tag} (${target.id})`, inline: true },
          { name: '⏰ Duration', value: durationText, inline: true },
          { name: '🛡️ Moderator', value: interaction.user.tag, inline: true },
          { name: '📝 Reason', value: reason, inline: false }
        ],
        color: getRandomColor()
      });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: '❌ Failed to ban the user!',
        ephemeral: true
      });
    }
  }
};