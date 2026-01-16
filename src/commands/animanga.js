const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { searchAnime, getAnimeDetails, searchManga, getMangaDetails } = require('../utils/anilist');
const { scrapeAnimeLink } = require('../utils/scraper');

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName('anime')
      .setDescription('Search for anime information')
      .addStringOption(opt =>
        opt.setName('name')
          .setDescription('Anime name')
          .setRequired(true)
      ),
    async execute(interaction, client) {
      await interaction.deferReply();
      
      const query = interaction.options.getString('name');
      
      try {
        const results = await searchAnime(query);
        
        if (results.length === 0) {
          return interaction.editReply({ content: '❌ No anime found!' });
        }
        
        if (results.length === 1) {
          const data = await getAnimeDetails(results[0].id);
          const link = await scrapeAnimeLink(data.title.romaji);
          
          const embed = createAnimeEmbed(data, link, interaction.user);
          return interaction.editReply({ embeds: [embed] });
        }
        
        const options = results.slice(0, 25).map(anime => ({
          label: anime.title.romaji.substring(0, 100),
          description: anime.title.native ? anime.title.native.substring(0, 100) : 'No native title',
          value: anime.id.toString()
        }));
        
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId(`anime_${interaction.user.id}`)
          .setPlaceholder('Select an anime')
          .addOptions(options);
        
        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        await interaction.editReply({ content: 'Multiple results found. Please select one:', components: [row] });
      } catch (err) {
        console.error(err);
        await interaction.editReply({ content: '❌ Error fetching anime data!' });
      }
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('manga')
      .setDescription('Search for manga information')
      .addStringOption(opt =>
        opt.setName('name')
          .setDescription('Manga name')
          .setRequired(true)
      ),
    async execute(interaction, client) {
      await interaction.deferReply();
      
      const query = interaction.options.getString('name');
      
      try {
        const results = await searchManga(query);
        
        if (results.length === 0) {
          return interaction.editReply({ content: '❌ No manga found!' });
        }
        
        if (results.length === 1) {
          const data = await getMangaDetails(results[0].id);
          const embed = createMangaEmbed(data, interaction.user);
          return interaction.editReply({ embeds: [embed] });
        }
        
        const options = results.slice(0, 25).map(manga => ({
          label: manga.title.romaji.substring(0, 100),
          description: manga.title.native ? manga.title.native.substring(0, 100) : 'No native title',
          value: manga.id.toString()
        }));
        
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId(`manga_${interaction.user.id}`)
          .setPlaceholder('Select a manga')
          .addOptions(options);
        
        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        await interaction.editReply({ content: 'Multiple results found. Please select one:', components: [row] });
      } catch (err) {
        console.error(err);
        await interaction.editReply({ content: '❌ Error fetching manga data!' });
      }
    }
  }
];

function createAnimeEmbed(data, link, user) {
  const formatDate = (d) => {
    if (!d || !d.year) return 'Unknown';
    return `${d.year}/${String(d.month).padStart(2, '0')}/${String(d.day).padStart(2, '0')}`;
  };
  
  const description = data.description ? data.description.replace(/<br>/g, '\n').replace(/<[^>]*>/g, '').replace(/\n{2,}/g, '\n') : 'No description';
  const shortDesc = description.length > 300 ? description.substring(0, 297) + '...' : description;
  
  const now = Date.now();
  const hoursDiff = 0;
  const footerText = `Requested by ${user.tag} ${hoursDiff}h ago`;
  
  return new EmbedBuilder()
    .setTitle(`${data.title.romaji}${data.title.native ? ` (${data.title.native})` : ''}`)
    .setDescription(shortDesc)
    .addFields(
      { name: '📊 Status', value: `${data.status} (${data.episodes || '?'} Eps)`, inline: true },
      { name: '🎬 Format', value: `${data.format} (${data.duration || '?'} min)`, inline: true },
      { name: '🏢 Studio', value: data.studios?.nodes?.[0]?.name || 'Unknown', inline: true },
      { name: '🎭 Genres', value: data.genres?.join(', ') || 'Unknown', inline: true },
      { name: '📅 Date', value: `${formatDate(data.startDate)} - ${formatDate(data.endDate)}`, inline: true },
      { name: '⭐ Score', value: `${(data.averageScore / 10).toFixed(1)}/10 (Rank #${data.rankings?.find(r => r.type === 'RATED')?.rank || '?'})`, inline: true },
      { name: '🔗 Link', value: link, inline: false }
    )
    .setColor(data.coverImage?.color || '#5865F2')
    .setThumbnail(data.coverImage?.large || null)
    .setFooter({ text: footerText })
    .setTimestamp();
}

function createMangaEmbed(data, user) {
  const formatDate = (d) => {
    if (!d || !d.year) return 'Unknown';
    return `${d.year}/${String(d.month).padStart(2, '0')}/${String(d.day).padStart(2, '0')}`;
  };
  
  const description = data.description ? data.description.replace(/<br>/g, '\n').replace(/<[^>]*>/g, '').replace(/\n{2,}/g, '\n') : 'No description';
  const shortDesc = description.length > 300 ? description.substring(0, 297) + '...' : description;
  
  const typeMap = { MANGA: 'Manga', NOVEL: 'Light Novel', ONE_SHOT: 'One Shot' };
  let mangaType = typeMap[data.format] || data.format;
  if (data.countryOfOrigin === 'CN') mangaType = 'Manhua';
  if (data.countryOfOrigin === 'KR') mangaType = 'Manhwa';
  
  const externalLinks = data.externalLinks || [];
  const readLink = externalLinks.find(l => l.site && (l.site.toLowerCase().includes('manga') || l.site.toLowerCase().includes('read')));
  const link = readLink ? readLink.url : 'n/a';
  
  const now = Date.now();
  const hoursDiff = 0;
  const footerText = `Requested by ${user.tag} ${hoursDiff}h ago`;
  
  return new EmbedBuilder()
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
}