import { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { createEmbed, getRelativeTime } from '../../utils/embedBuilder.js';
import User from '../../models/User.js';

const SLOT_SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '💎', '⭐', '7️⃣'];

export default {
  data: new SlashCommandBuilder()
    .setName('slot')
    .setDescription('Play slot machine game')
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

    const startButton = new ButtonBuilder()
      .setCustomId('slot_start')
      .setLabel('🎰 Spin')
      .setStyle(ButtonStyle.Success);

    const endButton = new ButtonBuilder()
      .setCustomId('slot_end')
      .setLabel('❌ End Game')
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(startButton, endButton);

    const embed = createEmbed({
      title: '🎰 Slot Machine',
      description: `**Bet Amount:** <:tcredits:1461586008360616027> ${betAmount.toLocaleString()}\n**Your Balance:** <:tcredits:1461586008360616027> ${userData.balance.toLocaleString()}\n\nPress Spin to play!`,
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

      if (i.customId === 'slot_end') {
        collector.stop('ended');
        const endEmbed = createEmbed({
          title: '🎰 Slot Machine Ended',
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
          title: '🎰 Slot Machine',
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

      const slot1 = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
      const slot2 = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
      const slot3 = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];

      let winAmount = 0;
      let multiplier = 0;

      // All three match
      if (slot1 === slot2 && slot2 === slot3) {
        if (slot1 === '7️⃣') {
          multiplier = 10;
        } else if (slot1 === '💎') {
          multiplier = 5;
        } else if (slot1 === '⭐') {
          multiplier = 3;
        } else {
          multiplier = 2;
        }
        winAmount = betAmount * multiplier;
      }
      // Two match
      else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
        multiplier = 0.5;
        winAmount = Math.floor(betAmount * multiplier);
      }

      if (winAmount > 0) {
        userData.balance += winAmount;
        await userData.save();

        const winEmbed = createEmbed({
          title: '🎰 Slot Machine - WIN! 🎉',
          description: `[ ${slot1} | ${slot2} | ${slot3} ]\n\n**Multiplier:** ${multiplier}x\n**Won:** <:tcredits:1461586008360616027> +${winAmount.toLocaleString()}\n**New Balance:** <:tcredits:1461586008360616027> ${userData.balance.toLocaleString()}`,
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
          title: '🎰 Slot Machine - LOSE! 😢',
          description: `[ ${slot1} | ${slot2} | ${slot3} ]\n\n**Lost:** <:tcredits:1461586008360616027> -${betAmount.toLocaleString()}\n**New Balance:** <:tcredits:1461586008360616027> ${userData.balance.toLocaleString()}`,
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
          title: '🎰 Slot Machine',
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