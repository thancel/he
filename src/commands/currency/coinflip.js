import { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { createEmbed, getRelativeTime } from '../../utils/embedBuilder.js';
import User from '../../models/User.js';

export default {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Play coinflip game')
    .addIntegerOption(option =>
      option
        .setName('amount')
        .setDescription('Amount to bet')
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    const betAmount = interaction.options.getInteger('amount');

    let userData = await User.findOne({ userId: interaction.user.id });

    if (!userData) {
      userData = await User.create({
        userId: interaction.user.id,
        balance: 0
      });
    }

    if (userData.balance < betAmount) {
      return interaction.reply({
        content: `❌ Insufficient balance! You have <:tcredits:1461586008360616027> **${userData.balance.toLocaleString()}** Credits`,
        ephemeral: true
      });
    }

    const headsButton = new ButtonBuilder()
      .setCustomId('coinflip_heads')
      .setLabel('🪙 Heads')
      .setStyle(ButtonStyle.Primary);

    const tailsButton = new ButtonBuilder()
      .setCustomId('coinflip_tails')
      .setLabel('🪙 Tails')
      .setStyle(ButtonStyle.Primary);

    const endButton = new ButtonBuilder()
      .setCustomId('coinflip_end')
      .setLabel('❌ End Game')
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(headsButton, tailsButton, endButton);

    const embed = createEmbed({
      title: '🪙 Coinflip Game',
      description: `**Bet Amount:** <:tcredits:1461586008360616027> ${betAmount.toLocaleString()}\n**Your Balance:** <:tcredits:1461586008360616027> ${userData.balance.toLocaleString()}\n\nChoose Heads or Tails!`,
      footer: {
        text: `Requested by ${interaction.user.username} • ${getRelativeTime(new Date())}`,
        iconURL: interaction.user.displayAvatarURL()
      }
    });

    const message = await interaction.reply({
      embeds: [embed],
      components: [row],
      fetchReply: true
    });

    const collector = message.createMessageComponentCollector({
      time: 60000
    });

    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({
          content: '❌ This is not your game!',
          ephemeral: true
        });
      }

      if (i.customId === 'coinflip_end') {
        collector.stop('ended');
        const endEmbed = createEmbed({
          title: '🪙 Coinflip Game Ended',
          description: `Game ended by player.\n**Final Balance:** <:tcredits:1461586008360616027> ${userData.balance.toLocaleString()}`,
          color: 0xFF0000,
          footer: {
            text: `Requested by ${interaction.user.username} • ${getRelativeTime(new Date())}`,
            iconURL: interaction.user.displayAvatarURL()
          }
        });
        await i.update({ embeds: [endEmbed], components: [] });
        return;
      }

      // Reload user data
      userData = await User.findOne({ userId: interaction.user.id });

      if (userData.balance < betAmount) {
        collector.stop('insufficient');
        const insufficientEmbed = createEmbed({
          title: '🪙 Coinflip Game',
          description: `❌ Insufficient balance!\n**Your Balance:** <:tcredits:1461586008360616027> ${userData.balance.toLocaleString()}`,
          color: 0xFF0000,
          footer: {
            text: `Requested by ${interaction.user.username} • ${getRelativeTime(new Date())}`,
            iconURL: interaction.user.displayAvatarURL()
          }
        });
        await i.update({ embeds: [insufficientEmbed], components: [] });
        return;
      }

      const choice = i.customId === 'coinflip_heads' ? 'heads' : 'tails';
      const result = Math.random() < 0.5 ? 'heads' : 'tails';
      const won = choice === result;

      if (won) {
        userData.balance += betAmount;
        await userData.save();

        const winEmbed = createEmbed({
          title: '🪙 Coinflip - YOU WON! 🎉',
          description: `The coin landed on **${result.toUpperCase()}**!\n\n**Won:** <:tcredits:1461586008360616027> +${betAmount.toLocaleString()}\n**New Balance:** <:tcredits:1461586008360616027> ${userData.balance.toLocaleString()}`,
          color: 0x00FF00,
          footer: {
            text: `Requested by ${interaction.user.username} • ${getRelativeTime(new Date())}`,
            iconURL: interaction.user.displayAvatarURL()
          }
        });

        await i.update({ embeds: [winEmbed], components: [row] });
      } else {
        userData.balance -= betAmount;
        await userData.save();

        const loseEmbed = createEmbed({
          title: '🪙 Coinflip - YOU LOST! 😢',
          description: `The coin landed on **${result.toUpperCase()}**!\n\n**Lost:** <:tcredits:1461586008360616027> -${betAmount.toLocaleString()}\n**New Balance:** <:tcredits:1461586008360616027> ${userData.balance.toLocaleString()}`,
          color: 0xFF0000,
          footer: {
            text: `Requested by ${interaction.user.username} • ${getRelativeTime(new Date())}`,
            iconURL: interaction.user.displayAvatarURL()
          }
        });

        if (userData.balance < betAmount) {
          collector.stop('insufficient');
          await i.update({ embeds: [loseEmbed], components: [] });
        } else {
          await i.update({ embeds: [loseEmbed], components: [row] });
        }
      }
    });

    collector.on('end', async (collected, reason) => {
      if (reason === 'time') {
        const timeoutEmbed = createEmbed({
          title: '🪙 Coinflip Game',
          description: '⏰ Game timed out!',
          color: 0xFF0000,
          footer: {
            text: `Requested by ${interaction.user.username} • ${getRelativeTime(new Date())}`,
            iconURL: interaction.user.displayAvatarURL()
          }
        });
        await interaction.editReply({ embeds: [timeoutEmbed], components: [] });
      }
    });
  }
};