import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, getRelativeTime } from '../../utils/embedBuilder.js';
import User from '../../models/User.js';

export default {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Claim your daily credits'),

  async execute(interaction) {
    let userData = await User.findOne({ userId: interaction.user.id });

    if (!userData) {
      userData = await User.create({
        userId: interaction.user.id,
        balance: 0,
        lastDaily: null,
        dailyStreak: 0
      });
    }

    const now = new Date();
    const lastDaily = userData.lastDaily;

    if (lastDaily) {
      const timeDiff = now - lastDaily;
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      if (hoursDiff < 24) {
        const hoursLeft = Math.ceil(24 - hoursDiff);
        return interaction.reply({
          content: `⏰ You already claimed your daily! Come back in **${hoursLeft}** hour${hoursLeft !== 1 ? 's' : ''}!`,
          ephemeral: true
        });
      }

      // Check if streak is maintained (claimed within 48 hours)
      if (hoursDiff <= 48) {
        userData.dailyStreak += 1;
      } else {
        userData.dailyStreak = 1;
      }
    } else {
      userData.dailyStreak = 1;
    }

    // Base reward: 500-750
    const baseReward = Math.floor(Math.random() * 251) + 500;
    
    // Bonus: 10% per streak
    const streakBonus = Math.floor(baseReward * (userData.dailyStreak - 1) * 0.1);
    const totalReward = baseReward + streakBonus;

    userData.balance += totalReward;
    userData.lastDaily = now;
    await userData.save();

    const embed = createEmbed({
      title: '🎁 Daily Reward Claimed!',
      description: `You received <:tcredits:1461586008360616027> **${totalReward.toLocaleString()}** Credits!`,
      fields: [
        { name: '💰 Base Reward', value: `${baseReward.toLocaleString()} Credits`, inline: true },
        { name: '🔥 Streak Bonus', value: `${streakBonus.toLocaleString()} Credits (${userData.dailyStreak}x)`, inline: true },
        { name: '💳 New Balance', value: `${userData.balance.toLocaleString()} Credits`, inline: false }
      ],
      footer: {
        text: `Requested by ${interaction.user.username} • ${getRelativeTime(new Date())}`,
        iconURL: interaction.user.displayAvatarURL()
      }
    });

    await interaction.reply({ embeds: [embed] });
  }
};