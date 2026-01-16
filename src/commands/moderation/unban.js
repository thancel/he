import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createEmbed, getRandomColor } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user from the server')
    .addStringOption(option =>
      option
        .setName('userid')
        .setDescription('The user ID to unban')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for unbanning')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const userId = interaction.options.getString('userid');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!/^\d{17,19}$/.test(userId)) {
      return interaction.reply({
        content: '❌ Invalid user ID format!',
        ephemeral: true
      });
    }

    try {
      const bans = await interaction.guild.bans.fetch();
      const bannedUser = bans.get(userId);

      if (!bannedUser) {
        return interaction.reply({
          content: '❌ This user is not banned!',
          ephemeral: true
        });
      }

      await interaction.guild.members.unban(userId, reason);

      const embed = createEmbed({
        title: '✅ User Unbanned',
        description: `**${bannedUser.user.tag}** has been unbanned successfully!`,
        fields: [
          { name: '👤 User', value: `${bannedUser.user.tag} (${userId})`, inline: true },
          { name: '🛡️ Moderator', value: interaction.user.tag, inline: true },
          { name: '📝 Reason', value: reason, inline: false }
        ],
        color: getRandomColor()
      });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: '❌ Failed to unban the user!',
        ephemeral: true
      });
    }
  }
};