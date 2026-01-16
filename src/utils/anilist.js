import axios from 'axios';

const ANILIST_API = 'https://graphql.anilist.co';

export async function searchAnime(query) {
  const graphqlQuery = `
    query ($search: String) {
      Page(page: 1, perPage: 10) {
        media(search: $search, type: ANIME) {
          id
          title {
            romaji
            english
            native
          }
          description
          episodes
          duration
          format
          status
          startDate {
            year
            month
            day
          }
          endDate {
            year
            month
            day
          }
          averageScore
          popularity
          studios {
            nodes {
              name
            }
          }
          genres
          coverImage {
            large
          }
          siteUrl
          externalLinks {
            site
            url
          }
        }
      }
    }
  `;

  try {
    const response = await axios.post(ANILIST_API, {
      query: graphqlQuery,
      variables: { search: query }
    });

    return response.data.data.Page.media;
  } catch (error) {
    console.error('Error fetching anime from AniList:', error);
    return [];
  }
}

export async function searchManga(query) {
  const graphqlQuery = `
    query ($search: String) {
      Page(page: 1, perPage: 10) {
        media(search: $search, type: MANGA) {
          id
          title {
            romaji
            english
            native
          }
          description
          chapters
          volumes
          format
          status
          startDate {
            year
            month
            day
          }
          endDate {
            year
            month
            day
          }
          averageScore
          popularity
          staff {
            edges {
              role
              node {
                name {
                  full
                }
              }
            }
          }
          genres
          coverImage {
            large
          }
          siteUrl
          externalLinks {
            site
            url
          }
        }
      }
    }
  `;

  try {
    const response = await axios.post(ANILIST_API, {
      query: graphqlQuery,
      variables: { search: query }
    });

    return response.data.data.Page.media;
  } catch (error) {
    console.error('Error fetching manga from AniList:', error);
    return [];
  }
}

export function formatDate(dateObj) {
  if (!dateObj || !dateObj.year) return 'N/A';
  const year = dateObj.year;
  const month = String(dateObj.month || 1).padStart(2, '0');
  const day = String(dateObj.day || 1).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

export function cleanDescription(description) {
  if (!description) return 'No description available.';
  
  // Remove HTML tags
  let cleaned = description.replace(/<[^>]*>/g, '');
  
  // Replace multiple newlines with single newline
  cleaned = cleaned.replace(/\n\n+/g, '\n');
  
  // Truncate if too long
  if (cleaned.length > 400) {
    cleaned = cleaned.substring(0, 397) + '...';
  }
  
  return cleaned;
}

export function getStatusEmoji(status) {
  const statusMap = {
    'FINISHED': 'Finished',
    'RELEASING': 'Ongoing',
    'NOT_YET_RELEASED': 'Not Yet Released',
    'CANCELLED': 'Cancelled',
    'HIATUS': 'Hiatus'
  };
  return statusMap[status] || status;
}

export function getFormatName(format) {
  const formatMap = {
    'TV': 'TV',
    'TV_SHORT': 'TV Short',
    'MOVIE': 'Movie',
    'SPECIAL': 'Special',
    'OVA': 'OVA',
    'ONA': 'ONA',
    'MUSIC': 'Music',
    'MANGA': 'Manga',
    'NOVEL': 'Light Novel',
    'ONE_SHOT': 'One Shot',
    'MANHWA': 'Manhwa',
    'MANHUA': 'Manhua'
  };
  return formatMap[format] || format;
}