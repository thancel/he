import { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, EmbedBuilder } from 'discord.js';
import { searchManga, formatDate, cleanDescription, getStatusEmoji, getFormatName } from '../../utils/anilist.js';
import { getMangaReadLink } from '../../utils/scraper.js';
import { getRelativeTime } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('manga')
    .setDescription('Search for manga information')
    .addStringOption(option =>
      option
        .setName('query')
        .setDescription('Manga name to search')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const query = interaction.options.getString('query');
    const results = await searchManga(query);

    if (results.length === 0) {
      return interaction.editReply({
        content: '❌ No manga found with that name!',
        ephemeral: true
      });
    }

    if (results.length === 1) {
      await displayManga(interaction, results[0]);
    } else {
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('manga_select')
        .setPlaceholder('Select a manga')
        .addOptions(
          results.slice(0, 25).map(manga => 
            new StringSelectMenuOptionBuilder()
              .setLabel(manga.title.romaji.substring(0, 100))
              .setDescription((manga.title.english || manga.title.romaji).substring(0, 100))
              .setValue(manga.id.toString())
          )
        );

      const row = new ActionRowBuilder().addComponents(selectMenu);

      const message = await interaction.editReply({
        content: `Found **${results.length}** manga. Please select one:`,
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
        const selectedManga = results.find(m => m.id === selectedId);

        if (selectedManga) {
          await i.deferUpdate();
          await displayManga(interaction, selectedManga);
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

async function displayManga(interaction, manga) {
  const title = `${manga.title.romaji}${manga.title.native ? ` (${manga.title.native})` : ''}`;
  const description = cleanDescription(manga.description);
  
  const status = getStatusEmoji(manga.status);
  const chapters = manga.chapters || 'N/A';
  const format = getFormatName(manga.format);
  
  // Get author
  const authorEdge = manga.staff.edges.find(e => e.role === 'Story' || e.role === 'Story & Art');
  const author = authorEdge ? authorEdge.node.name.full : 'N/A';
  
  const genres = manga.genres.join(', ') || 'N/A';
  const startDate = formatDate(manga.startDate);
  const endDate = formatDate(manga.endDate);
  
  // Get read link
  const readLink = getMangaReadLink(manga.externalLinks);

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(manga.coverImage.color || 0x02A9FF)
    .setThumbnail(manga.coverImage.large)
    .addFields(
      { name: '📊 Status', value: `${status} (${chapters} Ch)`, inline: true },
      { name: '📚 Type', value: format, inline: true },
      { name: '🏢 Author', value: author, inline: true },
      { name: '🎭 Genres', value: genres, inline: false },
      { name: '📅 Date', value: `${startDate} - ${endDate}`, inline: true },
      { name: '🔗 Link', value: readLink !== 'N/A' ? `[Read Here](${readLink})` : 'N/A', inline: true }
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