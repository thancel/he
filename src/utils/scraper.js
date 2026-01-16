const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function scrapeAnimeLink(animeTitle) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    const searchQuery = animeTitle.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
    const searchUrl = `https://aniwatchtv.to/search?keyword=${encodeURIComponent(animeTitle)}`;
    
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 15000 });
    
    const link = await page.evaluate(() => {
      const firstResult = document.querySelector('.film_list-wrap .flw-item a');
      return firstResult ? firstResult.href : null;
    });
    
    await browser.close();
    return link || 'n/a';
  } catch (err) {
    console.error('Scraper error:', err);
    if (browser) await browser.close();
    return 'n/a';
  }
}

module.exports = { scrapeAnimeLink };