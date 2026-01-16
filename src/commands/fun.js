const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Make the bot say something')
    .addStringOption(opt => 
      opt.setName('message')
        .setDescription('Message to send')
        .setRequired(true)
    )
    .addAttachmentOption(opt =>
      opt.setName('attachment')
        .setDescription('Attachment to send')
    ),
  async execute(interaction) {
    const message = interaction.options.getString('message');
    const attachment = interaction.options.getAttachment('attachment');
    
    const content = {
      content: message,
      files: attachment ? [attachment] : []
    };
    
    await interaction.channel.send(content);
    await interaction.reply({ content: '✅ Message sent successfully!', ephemeral: true });
  }
};