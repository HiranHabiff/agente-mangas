import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const CONFIG = {
  // APIs
  API_N1: (page: number) =>
    `https://api.kenmei.co/api/v2/series_search?page=${page}&sort%5Bscore%5D=desc`,
  API_N2: (slug: string) =>
    `https://api.kenmei.co/api/v1/manga_series/${slug}`,

  // Paths (relativos ao diretório do projeto)
  DATA_PAGES_DIR: resolve(__dirname, '../data-pages'),
  DATA_ITEMS_DIR: resolve(__dirname, '../data-items'),

  // Limites
  TOTAL_PAGES: 1409,
  DELAY_BETWEEN_REQUESTS: 500, // ms

  // Headers para simular navegador
  HEADERS: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'application/json',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  },

  // Retry
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000, // ms
};

// Helper para delay
export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Helper para log com timestamp
export const log = (message: string) => {
  const timestamp = new Date().toLocaleTimeString('pt-BR');
  console.log(`[${timestamp}] ${message}`);
};

// Helper para formatar tempo
export const formatTime = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
};
