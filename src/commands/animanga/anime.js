import { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, EmbedBuilder } from 'discord.js';
import { searchAnime, formatDate, cleanDescription, getStatusEmoji, getFormatName } from '../../utils/anilist.js';
import { scrapeAnimeLink } from '../../utils/scraper.js';
import { getRelativeTime } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('anime')
    .setDescription('Search for anime information')
    .addStringOption(option =>
      option
        .setName('query')
        .setDescription('Anime name to search')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const query = interaction.options.getString('query');
    const results = await searchAnime(query);

    if (results.length === 0) {
      return interaction.editReply({
        content: '❌ No anime found with that name!',
        ephemeral: true
      });
    }

    if (results.length === 1) {
      await displayAnime(interaction, results[0]);
    } else {
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('anime_select')
        .setPlaceholder('Select an anime')
        .addOptions(
          results.slice(0, 25).map(anime => 
            new StringSelectMenuOptionBuilder()
              .setLabel(anime.title.romaji.substring(0, 100))
              .setDescription((anime.title.english || anime.title.romaji).substring(0, 100))
              .setValue(anime.id.toString())
          )
        );

      const row = new ActionRowBuilder().addComponents(selectMenu);

      const message = await interaction.editReply({
        content: `Found **${results.length}** anime. Please select one:`,
        components: [row]
      });

      const collector = message.createMessageComponentCollector({
        time: 60000
      });

      collector.on('collect', async (i) => {
        if (i.user.id !== interaction.user.id) {
          return i.reply({
            content: '❌ This is not your selection!',
            ephemeral: true
          });
        }

        const selectedId = parseInt(i.values[0]);
        const selectedAnime = results.find(a => a.id === selectedId);

        if (selectedAnime) {
          await i.deferUpdate();
          await displayAnime(interaction, selectedAnime);
          collector.stop();
        }
      });

      collector.on('end', async (collected, reason) => {
        if (reason === 'time') {
          await interaction.editReply({
            content: '⏰ Selection timed out!',
            components: []
          });
        }
      });
    }
  }
};

async function displayAnime(interaction, anime) {
  const title = `${anime.title.romaji}${anime.title.native ? ` (${anime.title.native})` : ''}`;
  const description = cleanDescription(anime.description);
  
  const status = getStatusEmoji(anime.status);
  const episodes = anime.episodes || 'N/A';
  const format = getFormatName(anime.format);
  const duration = anime.duration ? `${anime.duration} min` : 'N/A';
  const studio = anime.studios.nodes.length > 0 ? anime.studios.nodes[0].name : 'N/A';
  const genres = anime.genres.join(', ') || 'N/A';
  const startDate = formatDate(anime.startDate);
  const endDate = formatDate(anime.endDate);
  const score = anime.averageScore ? `${(anime.averageScore / 10).toFixed(1)}/10` : 'N/A';
  const rank = anime.popularity ? `#${Math.floor(anime.popularity / 100)}` : 'N/A';

  // Scrape watch link
  await interaction.editReply({ content: '🔍 Searching for watch link...' });
  const watchLink = await scrapeAnimeLink(anime.title.romaji);

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(anime.coverImage.color || 0x02A9FF)
    .setThumbnail(anime.coverImage.large)
    .addFields(
      { name: '📊 Status', value: `${status} (${episodes} Eps)`, inline: true },
      { name: '🎬 Format', value: `${format} (${duration})`, inline: true },
      { name: '🏢 Studio', value: studio, inline: true },
      { name: '🎭 Genres', value: genres, inline: false },
      { name: '📅 Date', value: `${startDate} - ${endDate}`, inline: true },
      { name: '⭐ Score', value: `${score} (Rank ${rank})`, inline: true },
      { name: '🔗 Link', value: watchLink !== 'N/A' ? `[Watch Here](${watchLink})` : 'N/A', inline: true }
    )
    .setFooter({
      text: `Requested by ${interaction.user.username} • ${getRelativeTime(new Date())}`,
      iconURL: interaction.user.displayAvatarURL()
    })
    .setTimestamp();

  await interaction.editReply({
    content: null,
    embeds: [embed],
    components: []
  });
}