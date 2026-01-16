module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`✅ Logged in as ${client.user.tag}`);
    client.user.setActivity('Hefang Bot | /help', { type: 3 });
    
    // Start giveaway checker
    setInterval(() => checkGiveaways(client), 10000);
  }
};

async function checkGiveaways(client) {
  const Giveaway = require('../models/Giveaway');
  const { EmbedBuilder } = require('discord.js');
  
  try {
    const giveaways = await Giveaway.find({ ended: false, endTime: { $lte: new Date() } });
    
    for (const giveaway of giveaways) {
      const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
      if (!channel) continue;
      
      const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);
      if (!message) continue;
      
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
        const user = await client.users.fetch(winnerId).catch(() => null);
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
    }
  } catch (err) {
    console.error('Giveaway check error:', err);
  }
}