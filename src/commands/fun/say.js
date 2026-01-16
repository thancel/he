import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Make the bot say something')
    .addStringOption(option =>
      option
        .setName('message')
        .setDescription('The message to send')
        .setRequired(true)
    )
    .addAttachmentOption(option =>
      option
        .setName('attachment')
        .setDescription('Optional attachment to send')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const message = interaction.options.getString('message');
    const attachment = interaction.options.getAttachment('attachment');

    try {
      const messageOptions = {
        content: message
      };

      if (attachment) {
        messageOptions.files = [attachment];
      }

      await interaction.channel.send(messageOptions);

      await interaction.reply({
        content: '✅ Message sent successfully!',
        ephemeral: true
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: '❌ Failed to send the message!',
        ephemeral: true
      });
    }
  }
};