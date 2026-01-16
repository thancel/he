import { ActivityType } from 'discord.js';

export default {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`✅ Bot is ready! Logged in as ${client.user.tag}`);
    console.log(`📊 Serving ${client.guilds.cache.size} guilds`);
    
    client.user.setActivity({
      name: 'with Discord.js',
      type: ActivityType.Playing
    });

    // Start giveaway checker
    setInterval(() => checkGiveaways(client), 10000);
    
    // Start mute checker
    setInterval(() => checkMutes(client), 30000);
  }
};

async function checkGiveaways(client) {
  const Giveaway = (await import('../models/Giveaway.js')).default;
  
  try {
    const expiredGiveaways = await Giveaway.find({
      ended: false,
      endTime: { $lte: new Date() }
    });

    for (const giveaway of expiredGiveaways) {
      await endGiveaway(client, giveaway);
    }
  } catch (error) {
    console.error('Error checking giveaways:', error);
  }
}

async function endGiveaway(client, giveaway) {
  const { createEmbed } = await import('../utils/embedBuilder.js');
  
  try {
    const channel = await client.channels.fetch(giveaway.channelId);
    const message = await channel.messages.fetch(giveaway.messageId);
    
    if (giveaway.participants.length < giveaway.winners) {
      const embed = createEmbed({
        title: '🎉 Giveaway Ended',
        description: `**Prize:** ${giveaway.prize}\n\n❌ Not enough participants!`,
        color: 0xFF0000
      });
      
      await message.edit({ embeds: [embed], components: [] });
    } else {
      const winners = [];
      const participants = [...giveaway.participants];
      
      for (let i = 0; i < giveaway.winners && participants.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * participants.length);
        winners.push(participants[randomIndex]);
        participants.splice(randomIndex, 1);
      }
      
      const winnerMentions = winners.map(id => `<@${id}>`).join(', ');
      
      const embed = createEmbed({
        title: '🎉 Giveaway Ended',
        description: `**Prize:** ${giveaway.prize}\n\n**Winners:** ${winnerMentions}\n\nCongratulations! 🎊`,
        color: 0x00FF00
      });
      
      await message.edit({ embeds: [embed], components: [] });
      await channel.send(`🎉 Congratulations ${winnerMentions}! You won **${giveaway.prize}**!`);
      
      for (const winnerId of winners) {
        try {
          const user = await client.users.fetch(winnerId);
          const dmEmbed = createEmbed({
            title: '🎉 You Won a Giveaway!',
            description: `Congratulations! You won **${giveaway.prize}** in ${channel.guild.name}!`,
            color: 0xFFD700
          });
          await user.send({ embeds: [dmEmbed] });
        } catch (error) {
          console.error(`Could not DM winner ${winnerId}:`, error);
        }
      }
      
      giveaway.winnerIds = winners;
    }
    
    giveaway.ended = true;
    await giveaway.save();
  } catch (error) {
    console.error('Error ending giveaway:', error);
  }
}

async function checkMutes(client) {
  const Mute = (await import('../models/Mute.js')).default;
  
  try {
    const expiredMutes = await Mute.find({
      unmuteAt: { $lte: new Date() }
    });

    for (const mute of expiredMutes) {
      try {
        const guild = await client.guilds.fetch(mute.guildId);
        const member = await guild.members.fetch(mute.userId);
        
        await member.timeout(null);
        await Mute.deleteOne({ _id: mute._id });
      } catch (error) {
        console.error('Error unmuting user:', error);
      }
    }
  } catch (error) {
    console.error('Error checking mutes:', error);
  }
}