const { execFile } = require('child_process');
const http = require('http');
const url = require('url');
const cheerio = require('cheerio');

const BASE_URL = 'https://v2.samehadaku.how';
const CURL_BIN = process.platform === 'win32' ? 'curl.exe' : 'curl';

function fetchRaw(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const args = ['-s', '-L'];
    if (options.method === 'POST') {
      args.push('-X', 'POST');
      if (options.body) {
        const bodyStr = typeof options.body === 'string' 
          ? options.body 
          : new URLSearchParams(options.body).toString();
        args.push('-d', bodyStr);
      }
    }
    args.push(endpoint);

    execFile(CURL_BIN, args, { maxBuffer: 20 * 1024 * 1024 }, (err, stdout) => {
      if (err) return reject(err);
      resolve(stdout);
    });
  });
}

function cleanUrl(link) {
  if (!link) return '';
  if (link.startsWith('http')) return link;
  if (link.startsWith('/')) return `${BASE_URL}${link}`;
  return `${BASE_URL}/${link}`;
}

function extractSlug(link) {
  if (!link) return '';
  const path = link.replace(BASE_URL, '').replace(/^\/+|\/+$/g, '');
  return path.split('/').pop() || '';
}

async function getLatest(page = 1) {
  const target = page > 1 
    ? `${BASE_URL}/anime-terbaru/page/${page}/` 
    : `${BASE_URL}/anime-terbaru/`;

  const html = await fetchRaw(target);
  const $ = cheerio.load(html);
  const data = [];

  $('.post-show ul li').each((_, el) => {
    const title = $(el).find('.entry-title a, .dtla h2 a').text().trim();
    const epUrl = cleanUrl($(el).find('.entry-title a, .dtla h2 a').attr('href'));
    if (!title || !epUrl) return;

    data.push({
      title,
      slug: extractSlug(epUrl),
      url: epUrl,
      thumbnail: $(el).find('.thumb img').attr('src') || null,
      episode: $(el).find('.dtla span:contains("Episode") author').text().trim() || null,
      postedBy: $(el).find('.dtla span.author author').text().trim() || null,
      releasedOn: $(el).find('.dtla span:contains("Released")').text().replace(/.*Released on:\s*/i, '').trim() || null
    });
  });

  return { status: 'success', page, total: data.length, data };
}

async function getTopAnime() {
  const html = await fetchRaw(BASE_URL);
  const $ = cheerio.load(html);
  const data = [];

  $('.topten-animesu .animepost').each((i, el) => {
    const title = $(el).find('.title, h2').text().trim();
    const itemUrl = cleanUrl($(el).find('a').attr('href'));
    if (!title || !itemUrl) return;

    data.push({
      rank: i + 1,
      title,
      slug: extractSlug(itemUrl),
      url: itemUrl,
      thumbnail: $(el).find('img').attr('src') || null,
      score: $(el).find('.score').text().trim() || null,
      type: $(el).find('.type').text().trim() || null
    });
  });

  return { status: 'success', total: data.length, data };
}

async function searchAnime(query, page = 1) {
  const target = page > 1 
    ? `${BASE_URL}/page/${page}/?s=${encodeURIComponent(query)}` 
    : `${BASE_URL}/?s=${encodeURIComponent(query)}`;

  const html = await fetchRaw(target);
  const $ = cheerio.load(html);
  const data = [];
  const seen = new Set();

  $('article.animepost, .animepost').each((_, el) => {
    const title = $(el).find('.title h2, h2').text().trim();
    const itemUrl = cleanUrl($(el).find('a').attr('href'));
    if (!title || !itemUrl || seen.has(itemUrl)) return;

    seen.add(itemUrl);
    data.push({
      title,
      slug: extractSlug(itemUrl),
      url: itemUrl,
      thumbnail: $(el).find('img').attr('src') || null,
      type: $(el).find('.type').text().trim() || null,
      score: $(el).find('.score').text().trim() || null,
      genres: $(el).find('.genres, .genresx').text().trim() || null
    });
  });

  return { status: 'success', query, page, total: data.length, data };
}

async function getAnimeDetail(slugOrUrl) {
  const target = slugOrUrl.startsWith('http') 
    ? slugOrUrl 
    : `${BASE_URL}/anime/${slugOrUrl.replace(/^\/+|\/+$/g, '')}/`;

  const html = await fetchRaw(target);
  const $ = cheerio.load(html);
  const info = {};

  $('.spe span').each((_, el) => {
    const key = $(el).find('b').text().replace(/[:\s]+$/, '').toLowerCase();
    const val = $(el).text().replace($(el).find('b').text(), '').replace(/^[:\s]+/, '').trim();
    if (key && val) info[key] = val;
  });

  const genres = [];
  $('.genre-info a, .genxed a').each((_, el) => {
    const name = $(el).text().trim();
    const href = $(el).attr('href');
    if (name) {
      genres.push({
        name,
        slug: extractSlug(href),
        url: cleanUrl(href)
      });
    }
  });

  const episodes = [];
  $('.lstepsiode ul li').each((_, el) => {
    const a = $(el).find('a').first();
    const epUrl = cleanUrl(a.attr('href'));
    const epTitle = a.text().trim();
    if (!epUrl) return;

    const match = epTitle.match(/Episode\s*(\d+(\.\d+)?)/i) || epUrl.match(/-episode-(\d+(\.\d+)?)/i);
    episodes.push({
      episode: match ? match[1] : null,
      title: epTitle,
      slug: extractSlug(epUrl),
      url: epUrl,
      date: $(el).find('.date').text().trim() || null
    });
  });

  return {
    status: 'success',
    title: $('h1.entry-title').text().trim(),
    slug: extractSlug(target),
    url: target,
    thumbnail: $('.thumb img').first().attr('src') || null,
    synopsis: $('.desc p, .entry-content-single').text().trim() || null,
    metadata: {
      japanese: info.japanese || null,
      english: info.english || null,
      status: info.status || null,
      type: info.type || null,
      source: info.source || null,
      duration: info.duration || null,
      totalEpisode: info['total episode'] || null,
      season: info.season || null,
      studio: info.studio || null,
      producers: info.producers || null,
      released: info.released || null
    },
    genres,
    batchUrl: cleanUrl($('.batchlink a').attr('href')) || null,
    totalEpisodes: episodes.length,
    episodes
  };
}

async function getEpisodeDetail(slugOrUrl, resolveStreams = true) {
  const target = slugOrUrl.startsWith('http') 
    ? slugOrUrl 
    : `${BASE_URL}/${slugOrUrl.replace(/^\/+|\/+$/g, '')}/`;

  const html = await fetchRaw(target);
  const $ = cheerio.load(html);

  const streamingServers = [];
  const serverEls = $('#server ul li div.east_player_option');

  for (let i = 0; i < serverEls.length; i++) {
    const el = serverEls[i];
    const name = $(el).find('span').text().trim();
    const post = $(el).attr('data-post');
    const nume = $(el).attr('data-nume');
    const available = !$(el).attr('style')?.includes('not-allowed');
    let embedUrl = null;

    if (resolveStreams && available && post && nume) {
      try {
        const rawAjax = await fetchRaw(`${BASE_URL}/wp-admin/admin-ajax.php`, {
          method: 'POST',
          body: { action: 'player_ajax', post, nume, type: 'schtml' }
        });
        const m = rawAjax.match(/src=["']([^"']+)["']/i);
        if (m) embedUrl = m[1];
      } catch (_) {}
    }

    streamingServers.push({
      name,
      available,
      postId: post || null,
      nume: nume || null,
      embedUrl
    });
  }

  const downloads = [];
  $('.download-eps').each((_, sec) => {
    const format = $(sec).find('p').first().text().trim() || 'Download';
    const qualities = [];

    $(sec).find('ul li').each((_, li) => {
      const q = $(li).find('strong, b').first().text().trim();
      const links = [];

      $(li).find('span a').each((_, a) => {
        const server = $(a).text().trim();
        const href = $(a).attr('href');
        if (server && href) links.push({ server, url: href });
      });

      if (q && links.length) qualities.push({ quality: q, links });
    });

    if (qualities.length) downloads.push({ format, qualities });
  });

  return {
    status: 'success',
    title: $('h1.entry-title').text().trim(),
    slug: extractSlug(target),
    url: target,
    navigation: {
      allEpisodesUrl: cleanUrl($('.naveps .nvsc a').attr('href')) || null,
      prevEpisodeUrl: cleanUrl($('.naveps .nvs.nvsl a').attr('href')) || null,
      nextEpisodeUrl: cleanUrl($('.naveps .nvs.nvsr a').attr('href')) || null
    },
    streamingServers,
    downloads
  };
}

async function getSchedule(day = 'monday') {
  const days = {
    senin: 'monday',
    selasa: 'tuesday',
    rabu: 'wednesday',
    kamis: 'thursday',
    jumat: 'friday',
    jumaat: 'friday',
    sabtu: 'saturday',
    minggu: 'sunday'
  };

  const selectedDay = days[day.toLowerCase()] || day.toLowerCase();
  const raw = await fetchRaw(`${BASE_URL}/wp-json/custom/v1/all-schedule?perpage=50&day=${selectedDay}`);
  const parsed = JSON.parse(raw);

  const data = parsed.map(item => ({
    id: item.id,
    title: item.title,
    slug: item.slug,
    url: cleanUrl(item.url),
    thumbnail: item.featured_img_src || null,
    genre: item.genre || null,
    score: item.east_score || null,
    type: item.east_type || null,
    day: item.east_schedule || selectedDay,
    time: item.east_time || null,
    synopsis: item.content ? item.content.replace(/<[^>]+>/g, '').trim() : null
  }));

  return { status: 'success', day: selectedDay, total: data.length, data };
}

async function getGenres() {
  const html = await fetchRaw(BASE_URL);
  const $ = cheerio.load(html);
  const data = [];
  const seen = new Set();

  $('a[href*="/genre/"]').each((_, el) => {
    const name = $(el).text().trim();
    const href = $(el).attr('href');
    const slug = extractSlug(href);
    if (!name || !slug || seen.has(slug)) return;

    seen.add(slug);
    data.push({ name, slug, url: cleanUrl(href) });
  });

  return { status: 'success', total: data.length, data };
}

async function getByGenre(genreSlug, page = 1) {
  const clean = genreSlug.replace(/^\/+|\/+$/g, '').replace('genre/', '');
  const target = page > 1 
    ? `${BASE_URL}/genre/${clean}/page/${page}/` 
    : `${BASE_URL}/genre/${clean}/`;

  const html = await fetchRaw(target);
  const $ = cheerio.load(html);
  const data = [];
  const seen = new Set();

  $('.animepost, article').each((_, el) => {
    const title = $(el).find('.title h2, h2').first().text().trim();
    const itemUrl = cleanUrl($(el).find('a').first().attr('href'));
    if (!title || !itemUrl || seen.has(itemUrl)) return;

    seen.add(itemUrl);
    data.push({
      title,
      slug: extractSlug(itemUrl),
      url: itemUrl,
      thumbnail: $(el).find('img').first().attr('src') || null,
      score: $(el).find('.score').text().trim() || null,
      type: $(el).find('.type').text().trim() || null
    });
  });

  return { status: 'success', genre: clean, page, total: data.length, data };
}

function startServer(port = 3000) {
  const server = http.createServer(async (req, res) => {
    const { pathname, query } = url.parse(req.url, true);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
      let result;
      if (pathname === '/' || pathname === '/api') {
        result = {
          message: 'Samehadaku Scraper API',
          routes: [
            '/api/latest?page=1',
            '/api/top',
            '/api/search?q=naruto&page=1',
            '/api/anime/:slug',
            '/api/episode/:slug',
            '/api/schedule?day=senin',
            '/api/genres',
            '/api/genre/:slug?page=1'
          ]
        };
      } else if (pathname === '/api/latest') {
        result = await getLatest(parseInt(query.page, 10) || 1);
      } else if (pathname === '/api/top') {
        result = await getTopAnime();
      } else if (pathname === '/api/search') {
        result = await searchAnime(query.q || query.s || '', parseInt(query.page, 10) || 1);
      } else if (pathname.startsWith('/api/anime/')) {
        result = await getAnimeDetail(pathname.replace('/api/anime/', ''));
      } else if (pathname.startsWith('/api/episode/')) {
        result = await getEpisodeDetail(pathname.replace('/api/episode/', ''));
      } else if (pathname === '/api/schedule') {
        result = await getSchedule(query.day || 'monday');
      } else if (pathname === '/api/genres') {
        result = await getGenres();
      } else if (pathname.startsWith('/api/genre/')) {
        result = await getByGenre(pathname.replace('/api/genre/', ''), parseInt(query.page, 10) || 1);
      } else {
        res.writeHead(404);
        return res.end(JSON.stringify({ status: 'error', message: 'Not found' }));
      }

      res.writeHead(200);
      res.end(JSON.stringify(result, null, 2));
    } catch (err) {
      res.writeHead(500);
      res.end(JSON.stringify({ status: 'error', message: err.message }));
    }
  });

  server.listen(port, () => console.log(`Server: http://localhost:${port}`));
}

if (require.main === module) {
  const [,, cmd = 'latest', arg, page] = process.argv;

  (async () => {
    if (cmd === 'serve') return startServer(parseInt(arg, 10) || 3000);

    const routes = {
      latest: () => getLatest(parseInt(arg, 10) || 1),
      top: () => getTopAnime(),
      search: () => searchAnime(arg || 'naruto', parseInt(page, 10) || 1),
      detail: () => getAnimeDetail(arg || 'naruto-kecil'),
      episode: () => getEpisodeDetail(arg || 'mushoku-tensei-isekai-ittara-honki-dasu-season-3-episode-11'),
      schedule: () => getSchedule(arg || 'monday'),
      genres: () => getGenres(),
      genre: () => getByGenre(arg || 'action', parseInt(page, 10) || 1)
    };

    if (!routes[cmd]) {
      console.log('Usage: node samehadaku.js [latest|top|search|detail|episode|schedule|genres|genre|serve]');
      return;
    }

    const res = await routes[cmd]();
    console.log(JSON.stringify(res, null, 2));
  })();
}

module.exports = {
  getLatest,
  getTopAnime,
  searchAnime,
  getAnimeDetail,
  getEpisodeDetail,
  getSchedule,
  getGenres,
  getByGenre,
  startServer
};
