const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ms = require('ms');
const Giveaway = require('../models/Giveaway');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ga')
    .setDescription('Giveaway management')
    .addStringOption(opt =>
      opt.setName('type')
        .setDescription('Action type')
        .setRequired(true)
        .addChoices(
          { name: 'Start', value: 'start' },
          { name: 'End', value: 'end' },
          { name: 'List', value: 'list' }
        )
    )
    .addStringOption(opt =>
      opt.setName('duration')
        .setDescription('Duration (1s, 1m, 1h, 1d)')
    )
    .addIntegerOption(opt =>
      opt.setName('winners')
        .setDescription('Number of winners')
        .setMinValue(1)
    )
    .addStringOption(opt =>
      opt.setName('prize')
        .setDescription('Prize description')
    )
    .addStringOption(opt =>
      opt.setName('id')
        .setDescription('Giveaway ID (for end)')
    ),
  async execute(interaction) {
    const type = interaction.options.getString('type');
    
    if (type === 'start') {
      const duration = interaction.options.getString('duration');
      const winners = interaction.options.getInteger('winners');
      const prize = interaction.options.getString('prize');
      
      if (!duration || !winners || !prize) {
        return interaction.reply({ content: '❌ Please provide duration, winners, and prize!', ephemeral: true });
      }
      
      const time = ms(duration);
      if (!time) {
        return interaction.reply({ content: '❌ Invalid duration format!', ephemeral: true });
      }
      
      const giveawayId = Math.random().toString(36).substring(2, 6).toUpperCase();
      const endTime = new Date(Date.now() + time);
      
      const embed = new EmbedBuilder()
        .setTitle('🎉 GIVEAWAY 🎉')
        .setDescription(`Prize: ${prize}\n\n👥 Participants: 0`)
        .setColor('#FFD700')
        .setFooter({ 
          text: `${interaction.user.tag} | ID: ${giveawayId} | Ends at ${endTime.toLocaleString('en-US', { timeZone: 'UTC' })}` 
        })
        .setTimestamp(endTime);
      
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`gajoin_${giveawayId}`)
          .setLabel('Join')
          .setStyle(ButtonStyle.Success)
          .setEmoji('🎉'),
        new ButtonBuilder()
          .setCustomId(`galeave_${giveawayId}`)
          .setLabel('Leave')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('👋')
      );
      
      const msg = await interaction.channel.send({ embeds: [embed], components: [row] });
      
      const giveaway = new Giveaway({
        giveawayId,
        guildId: interaction.guild.id,
        channelId: interaction.channel.id,
        messageId: msg.id,
        hostId: interaction.user.id,
        prize,
        winners,
        endTime,
        participants: []
      });
      
      await giveaway.save();
      await interaction.reply({ content: `✅ Giveaway created with ID: **${giveawayId}**`, ephemeral: true });
      
    } else if (type === 'end') {
      const id = interaction.options.getString('id');
      if (!id) {
        return interaction.reply({ content: '❌ Please provide giveaway ID!', ephemeral: true });
      }
      
      const giveaway = await Giveaway.findOne({ giveawayId: id.toUpperCase(), ended: false });
      if (!giveaway) {
        return interaction.reply({ content: '❌ Giveaway not found or already ended!', ephemeral: true });
      }
      
      const channel = await interaction.guild.channels.fetch(giveaway.channelId);
      const message = await channel.messages.fetch(giveaway.messageId);
      
      const winnerCount = Math.min(giveaway.winners, giveaway.participants.length);
      const winners = [];
      
      if (winnerCount > 0) {
        const participants = [...giveaway.participants];
        for (let i = 0; i < winnerCount; i++) {
          const randomIndex = Math.floor(Math.random() * participants.length);
          winners.push(participants.splice(randomIndex, 1)[0]);
        }
      }
      
      const endEmbed = new EmbedBuilder()
        .setTitle('🎉 Giveaway Ended!')
        .setDescription(`Prize: ${giveaway.prize}\n\n${winners.length > 0 ? `Winners: ${winners.map(w => `<@${w}>`).join(', ')}` : 'No winners :('}`)
        .setColor('#FF0000')
        .setFooter({ text: `ID: ${giveaway.giveawayId} | Ended` })
        .setTimestamp();
      
      await message.edit({ embeds: [endEmbed], components: [] });
      
      for (const winnerId of winners) {
        const user = await interaction.client.users.fetch(winnerId).catch(() => null);
        if (user) {
          const winEmbed = new EmbedBuilder()
            .setTitle('🎊 Congratulations!')
            .setDescription(`You won the giveaway!\n\n**Prize:** ${giveaway.prize}`)
            .setColor('#00FF00')
            .setTimestamp();
          
          await user.send({ embeds: [winEmbed] }).catch(() => null);
        }
      }
      
      giveaway.ended = true;
      await giveaway.save();
      
      await interaction.reply({ content: '✅ Giveaway ended successfully!', ephemeral: true });
      
    } else if (type === 'list') {
      const giveaways = await Giveaway.find({ guildId: interaction.guild.id, ended: false });
      
      if (giveaways.length === 0) {
        return interaction.reply({ content: '❌ No active giveaways!', ephemeral: true });
      }
      
      const embed = new EmbedBuilder()
        .setTitle('📋 Active Giveaways')
        .setDescription(giveaways.map(g => 
          `**ID:** ${g.giveawayId}\n**Prize:** ${g.prize}\n**Ends:** <t:${Math.floor(g.endTime.getTime() / 1000)}:R>\n**Participants:** ${g.participants.length}`
        ).join('\n\n'))
        .setColor('#5865F2')
        .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
};