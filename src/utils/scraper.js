import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

export async function scrapeAnimeLink(animeTitle) {
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    const searchUrl = `${process.env.ANIWATCH_URL}/search?keyword=${encodeURIComponent(animeTitle)}`;
    
    await page.goto(searchUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for search results
    await page.waitForSelector('.film_list-wrap', { timeout: 10000 });

    // Get first result link
    const animeLink = await page.evaluate(() => {
      const firstResult = document.querySelector('.film_list-wrap .flw-item .film-detail .film-name a');
      return firstResult ? firstResult.href : null;
    });

    await browser.close();

    return animeLink || 'N/A';
  } catch (error) {
    console.error('Error scraping anime link:', error);
    if (browser) await browser.close();
    return 'N/A';
  }
}

export async function getMangaReadLink(externalLinks) {
  if (!externalLinks || externalLinks.length === 0) return 'N/A';

  const readingSites = ['MangaDex', 'Manga Plus', 'MangaUpdates', 'Official Site'];
  
  for (const site of readingSites) {
    const link = externalLinks.find(l => l.site === site);
    if (link) return link.url;
  }

  // Return first external link if no preferred site found
  return externalLinks[0]?.url || 'N/A';
}