import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, getFooterText, getRelativeTime } from '../../utils/embedBuilder.js';
import User from '../../models/User.js';

export default {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check your or someone else\'s balance')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to check balance')
        .setRequired(false)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;

    let userData = await User.findOne({ userId: targetUser.id });
    
    if (!userData) {
      userData = await User.create({
        userId: targetUser.id,
        balance: 0
      });
    }

    const embed = createEmbed({
      title: `💰 ${targetUser.username}'s Balance`,
      description: `<:tcredits:1461586008360616027> **${userData.balance.toLocaleString()}** Credits`,
      thumbnail: targetUser.displayAvatarURL({ dynamic: true }),
      footer: {
        text: `Requested by ${interaction.user.username} • ${getRelativeTime(new Date())}`,
        iconURL: interaction.user.displayAvatarURL()
      }
    });

    await interaction.reply({ embeds: [embed] });
  }
};