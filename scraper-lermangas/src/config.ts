// Configurações do scraper
export const CONFIG = {
  BASE_URL: 'https://lermangas.me',
  HOME_URL: 'https://lermangas.me/',
  PAGINATION_URL: (page: number) => `https://lermangas.me/page/${page}/`,

  // Limites
  MAX_PAGES: 100,
  DELAY_BETWEEN_REQUESTS: 1500, // ms - respeitar o servidor
  DELAY_BETWEEN_PAGES: 2000, // ms

  // Arquivos de saída
  LINKS_FILE: './data/manga-links.md',
  RESULTS_FILE: './data/scrape-results.json',

  // Headers para simular navegador
  HEADERS: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
  },

  // Seletores CSS
  SELECTORS: {
    // Para listagem
    MANGA_ITEM: '.page-item-detail',
    MANGA_LINK: '.post-title a, .item-thumb a',

    // Para página de detalhes
    TITLE: '.post-title h1',
    IMAGE: '.summary_image img',
    SYNOPSIS: '.description-summary .summary__content p, .summary__content',
    GENRES: '.genres-content a',
    AUTHOR: '.author-content a',
    ARTIST: '.artist-content a',
    STATUS: '.post-status .summary-content',
    CHAPTERS: '.wp-manga-chapter a',
    ALTERNATIVE_NAMES: '.post-content_item:contains("Alternative") .summary-content',
    RATING: '.post-total-rating .score',
  },

  // Database
  DB: {
    host: 'localhost',
    port: 5432,
    database: 'manga_db',
    user: 'manga_user',
    password: 'manga123',
  },

  // Paths
  IMAGES_PATH: '../storage/images',
};

// Helper para delay
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper para log com timestamp
export const log = (message: string, type: 'info' | 'error' | 'success' | 'warn' = 'info') => {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = {
    info: '📋',
    error: '❌',
    success: '✅',
    warn: '⚠️',
  }[type];
  console.log(`[${timestamp}] ${prefix} ${message}`);
};
