module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      
      try {
        await command.execute(interaction, client);
      } catch (err) {
        console.error(err);
        const reply = { content: '❌ An error occurred!', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply);
        } else {
          await interaction.reply(reply);
        }
      }
    } else if (interaction.isButton()) {
      await handleButton(interaction, client);
    } else if (interaction.isStringSelectMenu()) {
      await handleSelectMenu(interaction, client);
    }
  }
};

async function handleButton(interaction, client) {
  const [action, ...args] = interaction.customId.split('_');
  
  if (action === 'gajoin' || action === 'galeave') {
    const Giveaway = require('../models/Giveaway');
    const { EmbedBuilder } = require('discord.js');
    
    const giveawayId = args[0];
    const giveaway = await Giveaway.findOne({ giveawayId });
    
    if (!giveaway || giveaway.ended) {
      return interaction.reply({ content: '❌ This giveaway has ended!', ephemeral: true });
    }
    
    if (action === 'gajoin') {
      if (giveaway.participants.includes(interaction.user.id)) {
        return interaction.reply({ content: '❌ You already joined!', ephemeral: true });
      }
      giveaway.participants.push(interaction.user.id);
      await giveaway.save();
      
      const embed = EmbedBuilder.from(interaction.message.embeds[0])
        .setDescription(`Prize: ${giveaway.prize}\n\n👥 Participants: ${giveaway.participants.length}`);
      await interaction.message.edit({ embeds: [embed] });
      
      return interaction.reply({ content: '✅ You joined the giveaway!', ephemeral: true });
    } else {
      const index = giveaway.participants.indexOf(interaction.user.id);
      if (index === -1) {
        return interaction.reply({ content: '❌ You haven\'t joined!', ephemeral: true });
      }
      giveaway.participants.splice(index, 1);
      await giveaway.save();
      
      const embed = EmbedBuilder.from(interaction.message.embeds[0])
        .setDescription(`Prize: ${giveaway.prize}\n\n👥 Participants: ${giveaway.participants.length}`);
      await interaction.message.edit({ embeds: [embed] });
      
      return interaction.reply({ content: '👋 You left the giveaway!', ephemeral: true });
    }
  }
  
  if (action === 'coinflip') {
    const User = require('../models/User');
    const { EmbedBuilder } = require('discord.js');
    
    const [choice, amount, userId] = args;
    if (interaction.user.id !== userId) {
      return interaction.reply({ content: '❌ This is not your game!', ephemeral: true });
    }
    
    const user = await User.findOne({ userId: interaction.user.id, guildId: interaction.guild.id });
    if (!user || user.balance < parseInt(amount)) {
      return interaction.reply({ content: '❌ Insufficient balance!', ephemeral: true });
    }
    
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const won = result === choice;
    const amt = parseInt(amount);
    
    user.balance += won ? amt : -amt;
    await user.save();
    
    const embed = new EmbedBuilder()
      .setTitle('🪙 Coinflip Result')
      .setDescription(`Result: **${result.toUpperCase()}**\n\nYou ${won ? 'won' : 'lost'} ${client.config.currencyEmoji} ${amt}\n\nNew Balance: ${client.config.currencyEmoji} ${user.balance}`)
      .setColor(won ? '#00FF00' : '#FF0000')
      .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();
    
    await interaction.update({ embeds: [embed], components: interaction.message.components });
  }
  
  if (action === 'slot') {
    const User = require('../models/User');
    const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
    
    const [subAction, amount, userId] = args;
    if (interaction.user.id !== userId) {
      return interaction.reply({ content: '❌ This is not your game!', ephemeral: true });
    }
    
    if (subAction === 'end') {
      return interaction.update({ components: [] });
    }
    
    const user = await User.findOne({ userId: interaction.user.id, guildId: interaction.guild.id });
    if (!user || user.balance < parseInt(amount)) {
      return interaction.reply({ content: '❌ Insufficient balance!', ephemeral: true });
    }
    
    const symbols = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣'];
    const slot1 = symbols[Math.floor(Math.random() * symbols.length)];
    const slot2 = symbols[Math.floor(Math.random() * symbols.length)];
    const slot3 = symbols[Math.floor(Math.random() * symbols.length)];
    
    let multiplier = 0;
    if (slot1 === slot2 && slot2 === slot3) {
      multiplier = slot1 === '7️⃣' ? 10 : slot1 === '💎' ? 5 : 3;
    } else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
      multiplier = 1.5;
    }
    
    const amt = parseInt(amount);
    const winAmount = multiplier > 0 ? Math.floor(amt * multiplier) : 0;
    
    user.balance += winAmount > 0 ? winAmount - amt : -amt;
    await user.save();
    
    const embed = new EmbedBuilder()
      .setTitle('🎰 Slot Machine')
      .setDescription(`${slot1} | ${slot2} | ${slot3}\n\n${winAmount > 0 ? `You won ${client.config.currencyEmoji} ${winAmount}!` : `You lost ${client.config.currencyEmoji} ${amt}!`}\n\nNew Balance: ${client.config.currencyEmoji} ${user.balance}`)
      .setColor(winAmount > 0 ? '#00FF00' : '#FF0000')
      .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();
    
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`slot_start_${amount}_${userId}`).setLabel('Spin').setStyle(ButtonStyle.Success).setEmoji('🎰'),
      new ButtonBuilder().setCustomId(`slot_end_${amount}_${userId}`).setLabel('End').setStyle(ButtonStyle.Danger)
    );
    
    await interaction.update({ embeds: [embed], components: [row] });
  }
}

async function handleSelectMenu(interaction, client) {
  if (interaction.customId.startsWith('anime_') || interaction.customId.startsWith('manga_')) {
    const { EmbedBuilder } = require('discord.js');
    const { getAnimeDetails, getMangaDetails } = require('../utils/anilist');
    const { scrapeAnimeLink } = require('../utils/scraper');
    
    const id = interaction.values[0];
    const isAnime = interaction.customId.startsWith('anime_');
    
    try {
      const data = isAnime ? await getAnimeDetails(id) : await getMangaDetails(id);
      
      let link = 'n/a';
      if (isAnime) {
        link = await scrapeAnimeLink(data.title.romaji);
      } else {
        const externalLinks = data.externalLinks || [];
        const readLink = externalLinks.find(l => l.site && (l.site.toLowerCase().includes('manga') || l.site.toLowerCase().includes('read')));
        link = readLink ? readLink.url : 'n/a';
      }
      
      const formatDate = (d) => {
        if (!d || !d.year) return 'Unknown';
        return `${d.year}/${String(d.month).padStart(2, '0')}/${String(d.day).padStart(2, '0')}`;
      };
      
      const description = data.description ? data.description.replace(/<br>/g, '\n').replace(/<[^>]*>/g, '').replace(/\n{2,}/g, '\n') : 'No description';
      const shortDesc = description.length > 300 ? description.substring(0, 297) + '...' : description;
      
      const requestTime = Date.now();
      const hoursDiff = Math.floor((Date.now() - requestTime) / 3600000);
      const footerText = hoursDiff < 24 
        ? `Requested by ${interaction.user.tag} ${hoursDiff}h ago`
        : `Requested by ${interaction.user.tag} on ${new Date().toISOString().split('T')[0]}`;
      
      if (isAnime) {
        const embed = new EmbedBuilder()
          .setTitle(`${data.title.romaji}${data.title.native ? ` (${data.title.native})` : ''}`)
          .setDescription(shortDesc)
          .addFields(
            { name: '📊 Status', value: `${data.status} (${data.episodes || '?'} Eps)`, inline: true },
            { name: '🎬 Format', value: `${data.format} (${data.duration || '?'} min)`, inline: true },
            { name: '🏢 Studio', value: data.studios?.nodes?.[0]?.name || 'Unknown', inline: true },
            { name: '🎭 Genres', value: data.genres?.join(', ') || 'Unknown', inline: true },
            { name: '📅 Date', value: `${formatDate(data.startDate)} - ${formatDate(data.endDate)}`, inline: true },
            { name: '⭐ Score', value: `${(data.averageScore / 10).toFixed(1)}/10 (Rank #${data.rankings?.[0]?.rank || '?'})`, inline: true },
            { name: '🔗 Link', value: link, inline: false }
          )
          .setColor(data.coverImage?.color || '#5865F2')
          .setThumbnail(data.coverImage?.large || null)
          .setFooter({ text: footerText })
          .setTimestamp();
        
        await interaction.update({ embeds: [embed], components: [] });
      } else {
        const typeMap = { MANGA: 'Manga', NOVEL: 'Light Novel', ONE_SHOT: 'One Shot' };
        let mangaType = typeMap[data.format] || data.format;
        if (data.countryOfOrigin === 'CN') mangaType = 'Manhua';
        if (data.countryOfOrigin === 'KR') mangaType = 'Manhwa';
        
        const embed = new EmbedBuilder()
          .setTitle(`${data.title.romaji}${data.title.native ? ` (${data.title.native})` : ''}`)
          .setDescription(shortDesc)
          .addFields(
            { name: '📊 Status', value: `${data.status} (${data.chapters || '?'} Ch)`, inline: true },
            { name: '📚 Type', value: mangaType, inline: true },
            { name: '🏢 Author', value: data.staff?.edges?.[0]?.node?.name?.full || 'Unknown', inline: true },
            { name: '🎭 Genres', value: data.genres?.join(', ') || 'Unknown', inline: true },
            { name: '📅 Date', value: `${formatDate(data.startDate)} - ${formatDate(data.endDate)}`, inline: true },
            { name: '🔗 Link', value: link, inline: false }
          )
          .setColor(data.coverImage?.color || '#5865F2')
          .setThumbnail(data.coverImage?.large || null)
          .setFooter({ text: footerText })
          .setTimestamp();
        
        await interaction.update({ embeds: [embed], components: [] });
      }
    } catch (err) {
      await interaction.update({ content: '❌ Error fetching details!', components: [] });
    }
  }
}