import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, getRelativeTime } from '../../utils/embedBuilder.js';
import User from '../../models/User.js';

export default {
  data: new SlashCommandBuilder()
    .setName('give')
    .setDescription('Give credits to another user')
    .addIntegerOption(option =>
      option
        .setName('amount')
        .setDescription('Amount to give')
        .setRequired(true)
        .setMinValue(1)
    )
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to give credits to')
        .setRequired(true)
    ),

  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');
    const targetUser = interaction.options.getUser('user');

    if (targetUser.id === interaction.user.id) {
      return interaction.reply({
        content: '❌ You cannot give credits to yourself!',
        ephemeral: true
      });
    }

    if (targetUser.bot) {
      return interaction.reply({
        content: '❌ You cannot give credits to bots!',
        ephemeral: true
      });
    }

    let senderData = await User.findOne({ userId: interaction.user.id });

    if (!senderData) {
      senderData = await User.create({
        userId: interaction.user.id,
        balance: 0
      });
    }

    if (senderData.balance < amount) {
      return interaction.reply({
        content: `❌ Insufficient balance! You have <:tcredits:1461586008360616027> **${senderData.balance.toLocaleString()}** Credits`,
        ephemeral: true
      });
    }

    let receiverData = await User.findOne({ userId: targetUser.id });

    if (!receiverData) {
      receiverData = await User.create({
        userId: targetUser.id,
        balance: 0
      });
    }

    senderData.balance -= amount;
    receiverData.balance += amount;

    await senderData.save();
    await receiverData.save();

    const embed = createEmbed({
      title: '💸 Credits Transferred',
      description: `**${interaction.user.username}** gave <:tcredits:1461586008360616027> **${amount.toLocaleString()}** Credits to **${targetUser.username}**!`,
      fields: [
        { name: `${interaction.user.username}'s Balance`, value: `<:tcredits:1461586008360616027> ${senderData.balance.toLocaleString()}`, inline: true },
        { name: `${targetUser.username}'s Balance`, value: `<:tcredits:1461586008360616027> ${receiverData.balance.toLocaleString()}`, inline: true }
      ],
      footer: {
        text: `Requested by ${interaction.user.username} • ${getRelativeTime(new Date())}`,
        iconURL: interaction.user.displayAvatarURL()
      }
    });

    await interaction.reply({ embeds: [embed] });
  }
};