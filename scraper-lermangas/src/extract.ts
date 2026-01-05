/**
 * Módulo de extração de dados de mangás
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { CONFIG, log } from './config.js';

// Interface para dados do mangá
export interface MangaData {
  url: string;
  title: string;
  alternativeNames: string[];
  imageUrl: string | null;
  synopsis: string | null;
  genres: string[];
  author: string | null;
  artist: string | null;
  status: string | null;
  totalChapters: number;
  rating: number | null;
}

/**
 * Extrai dados de uma página de mangá
 */
export async function extractMangaData(url: string): Promise<MangaData> {
  log(`Buscando: ${url}`);

  const response = await axios.get(url, {
    headers: CONFIG.HEADERS,
    timeout: 30000,
  });

  const $ = cheerio.load(response.data);

  // Título principal
  let title = '';
  const titleElement = $('.post-title h1');
  if (titleElement.length) {
    // Remover spans internos (badges, etc)
    titleElement.find('span').remove();
    title = titleElement.text().trim();
  }

  // Nomes alternativos
  const alternativeNames: string[] = [];
  $('.post-content_item').each((_, item) => {
    const label = $(item).find('.summary-heading h5').text().toLowerCase();
    if (label.includes('alternative') || label.includes('alternativo')) {
      const names = $(item).find('.summary-content').text();
      names.split(/[,;]/).forEach(name => {
        const trimmed = name.trim();
        if (trimmed && trimmed !== title) {
          alternativeNames.push(trimmed);
        }
      });
    }
  });

  // Tentar extrair nomes alternativos do JSON-LD
  $('script[type="application/ld+json"]').each((_, script) => {
    try {
      const json = JSON.parse($(script).html() || '');
      if (json.alternativeHeadline) {
        const altNames = Array.isArray(json.alternativeHeadline)
          ? json.alternativeHeadline
          : [json.alternativeHeadline];
        altNames.forEach((name: string) => {
          if (name && !alternativeNames.includes(name) && name !== title) {
            alternativeNames.push(name);
          }
        });
      }
    } catch {
      // Ignorar erros de parse
    }
  });

  // Imagem
  let imageUrl: string | null = null;
  const imgElement = $('.summary_image img');
  if (imgElement.length) {
    imageUrl = imgElement.attr('data-src') || imgElement.attr('src') || null;
  }

  // Synopsis - tentar múltiplas fontes
  let synopsis: string | null = null;

  // 1. Tentar .manga-excerpt (encontrado no debug)
  const mangaExcerpt = $('.manga-excerpt');
  if (mangaExcerpt.length) {
    synopsis = mangaExcerpt.text().trim();
  }

  // 2. Tentar og:description (meta tag)
  if (!synopsis || synopsis.length < 50) {
    const ogDesc = $('meta[property="og:description"]').attr('content');
    if (ogDesc && ogDesc.length > (synopsis?.length || 0)) {
      synopsis = ogDesc;
    }
  }

  // 3. Tentar seletor padrão
  if (!synopsis) {
    const synopsisElement = $('.description-summary .summary__content, .summary__content');
    if (synopsisElement.length) {
      synopsis = synopsisElement.first().text().trim();
    }
  }

  // 4. Se não encontrou, tentar JSON-LD
  if (!synopsis) {
    $('script[type="application/ld+json"]').each((_, script) => {
      try {
        const json = JSON.parse($(script).html() || '');
        if (json.description) {
          synopsis = json.description;
        }
      } catch {
        // Ignorar
      }
    });
  }

  // Limpar synopsis
  if (synopsis) {
    synopsis = synopsis.replace(/\s+/g, ' ').trim();
    // Remover o título se estiver no início
    if (synopsis.startsWith(title)) {
      synopsis = synopsis.substring(title.length).trim();
    }
    // Remover "Continuar Lendo" do final
    synopsis = synopsis.replace(/\s*Continuar Lendo\s*→?\s*$/i, '').trim();
    // Limitar tamanho
    if (synopsis.length > 2000) {
      synopsis = synopsis.substring(0, 2000) + '...';
    }
    // Se ficou vazio, setar como null
    if (!synopsis) {
      synopsis = null;
    }
  }

  // Gêneros
  const genres: string[] = [];
  $('.genres-content a').each((_, el) => {
    const genre = $(el).text().trim();
    if (genre) genres.push(genre);
  });

  // Autor
  let author: string | null = null;
  const authorElement = $('.author-content a');
  if (authorElement.length) {
    author = authorElement.first().text().trim();
  }

  // Artista
  let artist: string | null = null;
  const artistElement = $('.artist-content a');
  if (artistElement.length) {
    artist = artistElement.first().text().trim();
  }

  // Status
  let status: string | null = null;
  $('.post-status .post-content_item').each((_, item) => {
    const label = $(item).find('.summary-heading h5').text().toLowerCase();
    if (label.includes('status')) {
      status = $(item).find('.summary-content').text().trim();
    }
  });

  // Total de capítulos
  const chapters = $('.wp-manga-chapter a');
  const totalChapters = chapters.length;

  // Rating
  let rating: number | null = null;
  const ratingElement = $('.post-total-rating .score, #averagerate');
  if (ratingElement.length) {
    const ratingText = ratingElement.text().trim();
    const parsed = parseFloat(ratingText);
    if (!isNaN(parsed)) {
      rating = parsed;
    }
  }

  return {
    url,
    title,
    alternativeNames,
    imageUrl,
    synopsis,
    genres,
    author,
    artist,
    status,
    totalChapters,
    rating,
  };
}
