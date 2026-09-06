# Samehadaku Scraper

Scraper `v2.samehadaku.how`. Menggunakan `curl` bawaan OS + Cheerio. Node 18+.

![Node](https://img.shields.io/badge/node-%3E%3D18-16a34a?logo=node.js&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)
![Dependencies](https://img.shields.io/badge/dependencies-cheerio-blue)
![CJS](https://img.shields.io/badge/module-CommonJS-2563eb)

## Cara Pakai

Simpan `samehadaku.js` di project:

```js
const {
  getLatest,
  getTopAnime,
  searchAnime,
  getAnimeDetail,
  getEpisodeDetail,
  getSchedule,
  getGenres,
  getByGenre,
  startServer
} = require('./samehadaku.js');
```

### 1. `getLatest(page)`

Daftar rilisan episode terbaru. `page` default `1`.

```js
const res = await getLatest(1);
```

```json
{
  "title": "Mushoku Tensei : Isekai Ittara Honki Dasu Season 3",
  "slug": "mushoku-tensei-isekai-ittara-honki-dasu-season-3-episode-11",
  "url": "https://v2.samehadaku.how/mushoku-tensei-isekai-ittara-honki-dasu-season-3-episode-11/",
  "thumbnail": "https://v2.samehadaku.how/wp-content/uploads/2026/09/image-2-2.jpg",
  "episode": "11",
  "postedBy": "Azuki",
  "releasedOn": "15 minutes yang lalu"
}
```

### 2. `getTopAnime()`

Top 10 anime minggu ini dari beranda.

```js
const top = await getTopAnime();
```

```json
{
  "rank": 1,
  "title": "One Piece",
  "slug": "one-piece",
  "url": "https://v2.samehadaku.how/anime/one-piece/",
  "thumbnail": "https://v2.samehadaku.how/wp-content/uploads/2020/04/E5RxYkWX0AAwdGH.png.jpg",
  "score": "8.73",
  "type": "TV"
}
```

### 3. `searchAnime(query, page)`

Cari anime berdasarkan judul.

```js
const hasil = await searchAnime('naruto', 1);
```

```json
{
  "title": "Naruto: Shippuuden",
  "slug": "naruto-shippuden",
  "url": "https://v2.samehadaku.how/anime/naruto-shippuden/",
  "thumbnail": "https://v2.samehadaku.how/wp-content/uploads/2020/05/17407.jpg",
  "type": "TVCompleted",
  "score": "8.15",
  "genres": "ActionAdventureComedyMartial ArtsShounenSuper Power"
}
```

### 4. `getAnimeDetail(slug)`

Detail informasi anime beserta daftar episode. `slug` dari `searchAnime()` atau `getLatest()`.

```js
const anime = await getAnimeDetail('naruto-kecil');
```

```json
{
  "title": "Naruto Kecil Sub Indo",
  "slug": "naruto-kecil",
  "url": "https://v2.samehadaku.how/anime/naruto-kecil/",
  "thumbnail": "https://v2.samehadaku.how/wp-content/uploads/2024/08/142503.jpg",
  "synopsis": "Bercerita tentang Uzumaki Naruto...",
  "metadata": {
    "japanese": "NARUTO -ナルト-",
    "english": "Naruto",
    "status": "Completed",
    "type": "TV",
    "source": "Manga",
    "duration": "23 min. per ep.",
    "totalEpisode": "220",
    "season": "Fall 2002",
    "studio": "Studio Pierrot",
    "producers": "TV Tokyo, Aniplex",
    "released": "Oct 3, 2002 to Feb 8, 2007"
  },
  "genres": [
    { "name": "Action", "slug": "action", "url": "https://v2.samehadaku.how/genre/action" }
  ],
  "batchUrl": null,
  "totalEpisodes": 220,
  "episodes": [
    {
      "episode": "220",
      "title": "Naruto Kecil Episode 220",
      "slug": "naruto-kecil-episode-220",
      "url": "https://v2.samehadaku.how/naruto-kecil-episode-220/",
      "date": "10 August 2024"
    }
  ]
}
```

### 5. `getEpisodeDetail(slug, resolveStreams)`

Link player streaming dan download per resolusi. `slug` dari `episodes[].slug`.

```js
const ep = await getEpisodeDetail('mushoku-tensei-isekai-ittara-honki-dasu-season-3-episode-11');
```

```json
{
  "title": "Mushoku Tensei : Isekai Ittara Honki Dasu Season 3 Episode 11 Sub Indo",
  "slug": "mushoku-tensei-isekai-ittara-honki-dasu-season-3-episode-11",
  "url": "https://v2.samehadaku.how/mushoku-tensei-isekai-ittara-honki-dasu-season-3-episode-11/",
  "navigation": {
    "allEpisodesUrl": "https://v2.samehadaku.how/anime/mushoku-tensei-isekai-ittara-honki-dasu-season-3/",
    "prevEpisodeUrl": "https://v2.samehadaku.how/mushoku-tensei-isekai-ittara-honki-dasu-season-3-episode-10/",
    "nextEpisodeUrl": null
  },
  "streamingServers": [
    {
      "name": "Wibufile 480p",
      "postId": "52481",
      "nume": "1",
      "embedUrl": "https://api.wibufile.com/embed/36be15b2-1340-466e-aec2-17dffbc80b38"
    },
    {
      "name": "Blogspot",
      "postId": "52481",
      "nume": "3",
      "embedUrl": "https://www.blogger.com/video.g?token=..."
    },
    {
      "name": "Mega 480p",
      "postId": "52481",
      "nume": "6",
      "embedUrl": "https://mega.nz/embed/AA9SgYpK#jzUkELC7PSpg-8el6TyduupdiZDmMkoh4IuySpBKQY0"
    }
  ],
  "downloads": [
    {
      "format": "MKV",
      "qualities": [
        {
          "quality": "480p",
          "links": [
            { "server": "Gofile", "url": "https://gofile.io/d/w8emqEtp" },
            { "server": "Filedon", "url": "https://filedon.co/view/UargvsnfYr" }
          ]
        }
      ]
    }
  ]
}
```

`streamingServers[].embedUrl` sudah di-resolve otomatis melalui endpoint internal AJAX (`action=player_ajax`).

### 6. `getSchedule(day)`

Jadwal rilis anime mingguan. Parameter `day`: `senin` .. `minggu` atau `monday` .. `sunday`.

```js
const jadwal = await getSchedule('senin');
```

```json
{
  "status": "success",
  "day": "monday",
  "total": 6,
  "data": [
    {
      "id": 460,
      "title": "One Piece",
      "slug": "one-piece",
      "url": "https://v2.samehadaku.how/anime/one-piece/",
      "thumbnail": "https://v2.samehadaku.how/wp-content/uploads/2020/04/E5RxYkWX0AAwdGH.png.jpg",
      "genre": "Action, Adventure",
      "score": "8.73",
      "type": "TV",
      "time": "00:00"
    }
  ]
}
```

### 7. `getGenres()` & `getByGenre(slug, page)`

Daftar semua genre dan arsip anime per genre.

```js
const genres = await getGenres();
const actionAnime = await getByGenre('action', 1);
```

### 8. CLI Langsung

File `samehadaku.js` dapat dijalankan langsung via terminal:

```bash
node samehadaku.js latest 1
node samehadaku.js search naruto
node samehadaku.js detail naruto-kecil
node samehadaku.js episode mushoku-tensei-isekai-ittara-honki-dasu-season-3-episode-11
node samehadaku.js schedule senin
node samehadaku.js top
node samehadaku.js genres
node samehadaku.js genre action 1
```

Jalankan REST API lokal:

```bash
node samehadaku.js serve 3000
```

## Error Umum

| Gejala | Penyebab | Perbaikan |
| --- | --- | --- |
| `HTTP 403` | Node `fetch` diblokir TLS fingerprint Cloudflare | Skrip menggunakan `curl` sistem yang otomatis lolos verifikasi. |
| `embedUrl` bernilai `null` | Server streaming berstatus nonaktif di situs | Gunakan opsi server berikutnya yang `available: true`. |
| `episodes` kosong | Slug salah | Ambil slug dari `getLatest()` atau `searchAnime()`, jangan menebak manual. |

## Batasan

Sumber data milik pihak ketiga (`v2.samehadaku.how`). Struktur HTML dapat berubah sewaktu-waktu. Kode ini hanya membaca konten web publik.

## Terms of Use & Disclaimer

Project ini dibuat hanya untuk tujuan edukasi dan riset teknis (educational purpose).

1. **Hak Cipta**: Seluruh konten media, video, poster, dan materi intelektual yang diambil melalui scraper ini adalah milik sah dari pemilik hak cipta dan penyedia aslinya.
2. **Penggunaan**: Pengembang tidak berafiliasi dengan penyedia konten terkait dan tidak bertanggung jawab atas segala bentuk penyalahgunaan script ini oleh pihak ketiga.
3. **Tanpa Garansi**: Script ini disediakan "as is" tanpa jaminan ketersediaan atau kelanjutan fungsi jika struktur web sumber berubah.

## Donasi

Terbantu? Traktir kopi:

[![Buy Me A Coffee](https://img.shields.io/badge/☕-Buy%20Me%20A%20Coffee-FFDD00?logo=buymeacoffee&logoColor=black)](https://warungerik.com/payment)

## Lisensi

MIT.[`LICENSE`](./LICENSE).
