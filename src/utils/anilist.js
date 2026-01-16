const axios = require('axios');

const ANILIST_API = 'https://graphql.anilist.co';

async function searchAnime(query) {
  const graphqlQuery = `
    query ($search: String) {
      Page(page: 1, perPage: 10) {
        media(search: $search, type: ANIME) {
          id
          title {
            romaji
            native
          }
        }
      }
    }
  `;
  
  const response = await axios.post(ANILIST_API, {
    query: graphqlQuery,
    variables: { search: query }
  });
  
  return response.data.data.Page.media;
}

async function getAnimeDetails(id) {
  const graphqlQuery = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        title {
          romaji
          native
        }
        description
        status
        episodes
        format
        duration
        genres
        averageScore
        coverImage {
          large
          color
        }
        studios {
          nodes {
            name
          }
        }
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
        rankings {
          rank
          type
        }
        externalLinks {
          url
          site
        }
      }
    }
  `;
  
  const response = await axios.post(ANILIST_API, {
    query: graphqlQuery,
    variables: { id: parseInt(id) }
  });
  
  return response.data.data.Media;
}

async function searchManga(query) {
  const graphqlQuery = `
    query ($search: String) {
      Page(page: 1, perPage: 10) {
        media(search: $search, type: MANGA) {
          id
          title {
            romaji
            native
          }
        }
      }
    }
  `;
  
  const response = await axios.post(ANILIST_API, {
    query: graphqlQuery,
    variables: { search: query }
  });
  
  return response.data.data.Page.media;
}

async function getMangaDetails(id) {
  const graphqlQuery = `
    query ($id: Int) {
      Media(id: $id, type: MANGA) {
        id
        title {
          romaji
          native
        }
        description
        status
        chapters
        volumes
        format
        genres
        averageScore
        countryOfOrigin
        coverImage {
          large
          color
        }
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
        externalLinks {
          url
          site
        }
      }
    }
  `;
  
  const response = await axios.post(ANILIST_API, {
    query: graphqlQuery,
    variables: { id: parseInt(id) }
  });
  
  return response.data.data.Media;
}

module.exports = {
  searchAnime,
  getAnimeDetails,
  searchManga,
  getMangaDetails
};