import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createEmbed, getRandomColor } from '../../utils/embedBuilder.js';
import Mute from '../../models/Mute.js';
import ms from 'ms';

export default {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mute a member in the server')
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('The member to mute')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('duration')
        .setDescription('Duration of mute (e.g., 1d, 1h, 1m) - Leave empty for permanent')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for muting')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

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
        content: '❌ You cannot mute yourself!',
        ephemeral: true
      });
    }

    if (target.roles.highest.position >= interaction.member.roles.highest.position) {
      return interaction.reply({
        content: '❌ You cannot mute this user! They have higher or equal role.',
        ephemeral: true
      });
    }

    if (!target.moderatable) {
      return interaction.reply({
        content: '❌ I cannot mute this user!',
        ephemeral: true
      });
    }

    let duration = ms('28d'); // Discord max timeout
    let durationText = 'Permanent';

    if (durationStr) {
      const parsedDuration = ms(durationStr);
      if (!parsedDuration) {
        return interaction.reply({
          content: '❌ Invalid duration format! Use formats like: 1d, 1h, 1m, 1s',
          ephemeral: true
        });
      }
      duration = Math.min(parsedDuration, ms('28d'));
      durationText = ms(duration, { long: true });
    }

    try {
      await target.timeout(duration, reason);

      const unmuteAt = new Date(Date.now() + duration);
      
      await Mute.findOneAndUpdate(
        { userId: target.id, guildId: interaction.guild.id },
        { userId: target.id, guildId: interaction.guild.id, unmuteAt, reason },
        { upsert: true }
      );

      const embed = createEmbed({
        title: '🔇 Member Muted',
        description: `**${target.user.tag}** has been muted!`,
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
        content: '❌ Failed to mute the user!',
        ephemeral: true
      });
    }
  }
};