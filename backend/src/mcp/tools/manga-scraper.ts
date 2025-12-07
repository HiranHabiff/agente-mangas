import { z } from 'zod';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../../utils/logger';
import { config } from '../../config/env';

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

interface MangaInfo {
  title?: string;
  alternativeTitles?: string[];
  synopsis?: string;
  genres?: string[];
  status?: string;
  author?: string;
  artist?: string;
  chapters?: number;
  volumes?: number;
  rating?: number;
  coverImage?: string;
  sourceUrl?: string;
}

// Alias para compatibilidade
type ScrapedMangaInfo = MangaInfo;

/**
 * Busca mangá diretamente no MyAnimeList usando página de busca
 */
export async function searchMangaOnMyAnimeList(mangaName: string): Promise<string | null> {
  try {
    const searchTerm = encodeURIComponent(mangaName);
    const searchUrl = `https://myanimelist.net/manga.php?q=${searchTerm}`;
    
    logger.info('Searching MyAnimeList for manga', { mangaName, searchUrl });

    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    
    // Múltiplas estratégias para encontrar o link do mangá
    let mangaLink: string | undefined;
    
    // Estratégia 1: Procurar na tabela de resultados
    const firstResult = $('.js-block-list tbody tr').first();
    mangaLink = firstResult.find('a.hoverinfo_trigger').attr('href');
    
    // Estratégia 2: Procurar qualquer link que contenha /manga/ e o nome
    if (!mangaLink) {
      $('a[href*="/manga/"]').each((_, element) => {
        const href = $(element).attr('href');
        if (href && !href.includes('?q=') && href.match(/\/manga\/\d+\//)) {
          mangaLink = href;
          return false; // Break loop
        }
        return; // Explicitly return void
      });
    }
    
    // Estratégia 3: Buscar no título específico
    if (!mangaLink) {
      const titleLink = $('a.hoverinfo_trigger[href*="/manga/"]').first().attr('href');
      if (titleLink) mangaLink = titleLink;
    }
    
    if (mangaLink) {
      // Garantir que é URL completa
      if (!mangaLink.startsWith('http')) {
        mangaLink = `https://myanimelist.net${mangaLink}`;
      }
      logger.info('Found manga on MyAnimeList', { url: mangaLink });
      return mangaLink;
    }
    
    logger.warn('No manga found on MyAnimeList search', { mangaName });
    return null;
  } catch (error) {
    logger.error('Failed to search MyAnimeList', { error, mangaName });
    return null;
  }
}

/**
 * Busca usando Google Custom Search API
 */
export async function searchMangaWithGoogleAPI(
  mangaName: string,
  additionalTerms: string = 'manga myanimelist'
): Promise<string[]> {
  try {
    const query = `${mangaName} ${additionalTerms}`;
    const apiKey = config.googleSearch.apiKey;
    const searchEngineId = config.googleSearch.searchEngineId;

    // Se não tiver Search Engine ID configurado, criar URLs diretas
    if (!searchEngineId || searchEngineId === 'your-search-engine-id') {
      logger.warn('Google Search Engine ID not configured, using direct URLs');
      const searchTerm = encodeURIComponent(mangaName);
      return [
        `https://myanimelist.net/manga.php?q=${searchTerm}`,
        `https://anilist.co/search/manga?search=${searchTerm}`,
      ];
    }

    logger.info('Searching with Google Custom Search API', { mangaName, query });

    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&num=5`;

    const response = await axios.get(searchUrl, { timeout: 10000 });

    const urls: string[] = [];
    
    if (response.data.items) {
      for (const item of response.data.items) {
        const url = item.link;
        // Filtrar apenas sites de mangá conhecidos
        if (
          url.includes('myanimelist.net/manga/') ||
          url.includes('anilist.co/manga/') ||
          url.includes('mangadex.org/title/') ||
          url.includes('mangaupdates.com/series/')
        ) {
          urls.push(url);
        }
      }
    }

    logger.info('Google Custom Search completed', { foundUrls: urls.length });
    return urls;
  } catch (error) {
    logger.error('Failed to search with Google API', { error, mangaName });
    // Fallback para URLs diretas
    const searchTerm = encodeURIComponent(mangaName);
    return [
      `https://myanimelist.net/manga.php?q=${searchTerm}`,
    ];
  }
}

/**
 * Busca informações de mangá no Google (SCRAPING - FALLBACK)
 */
export async function searchMangaOnGoogle(
  mangaName: string,
  additionalTerms: string = 'manga myanimelist anilist'
): Promise<string[]> {
  try {
    const query = `${mangaName} ${additionalTerms}`;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    
    logger.info('Searching Google for manga (scraping)', { mangaName, query });

    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const urls: string[] = [];

    // Extrair URLs dos resultados de busca
    $('a').each((_, element) => {
      const href = $(element).attr('href');
      if (href && href.startsWith('/url?q=')) {
        const url = href.split('/url?q=')[1]?.split('&')[0];
        if (url && !url.includes('google.com')) {
          try {
            const decodedUrl = decodeURIComponent(url);
            // Priorizar sites conhecidos de mangá
            if (
              decodedUrl.includes('myanimelist.net') ||
              decodedUrl.includes('anilist.co') ||
              decodedUrl.includes('mangadex.org') ||
              decodedUrl.includes('mangaupdates.com') ||
              decodedUrl.includes('kitsu.io')
            ) {
              urls.push(decodedUrl);
            }
          } catch (e) {
            // Ignorar URLs inválidas
          }
        }
      }
    });

    // Remover duplicatas e limitar a 5 URLs
    const uniqueUrls = [...new Set(urls)].slice(0, 5);
    logger.info('Google search completed', { foundUrls: uniqueUrls.length });
    
    return uniqueUrls;
  } catch (error) {
    logger.error('Failed to search Google', { error, mangaName });
    return [];
  }
}

/**
 * Faz scraping de uma URL para extrair informações de mangá
 */
export async function scrapeMangaPage(url: string): Promise<ScrapedMangaInfo> {
  try {
    logger.info('Scraping manga page', { url });

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    const info: ScrapedMangaInfo = { sourceUrl: url };

    // MyAnimeList scraping
    if (url.includes('myanimelist.net')) {
      // Check if it's a search results page or manga detail page
      const isSearchPage = url.includes('/manga.php?q=');
      
      if (isSearchPage) {
        // Search results page - get first result
        const firstResult = $('.js-block-list tbody tr').first();
        const mangaLink = firstResult.find('a.hoverinfo_trigger').attr('href');
        
        if (mangaLink) {
          logger.info('Found manga on search page, fetching detail page', { url: mangaLink });
          return await scrapeMangaPage(mangaLink);  // Recursive call for detail page
        }
        
        // Fallback: extract from search result
        info.title = firstResult.find('strong').text().trim();
        info.synopsis = firstResult.find('.pt4').text().trim();
        info.coverImage = firstResult.find('img').attr('data-src') || firstResult.find('img').attr('src');
      } else {
        // Manga detail page
        info.title = $('h1.title-name').text().trim() || $('span[itemprop="name"]').first().text().trim();
        
        const altTitles = $('div.spaceit_pad:contains("Synonyms:")').text().replace('Synonyms:', '').trim();
        if (altTitles) {
          info.alternativeTitles = altTitles.split(',').map(t => t.trim()).filter(t => t);
        }

        info.synopsis = $('p[itemprop="description"]').text().trim() || 
                       $('span[itemprop="description"]').text().trim();

        const genreElements = $('span[itemprop="genre"]');
        info.genres = genreElements.map((_, el) => $(el).text().trim()).get();

        const statusText = $('div.spaceit_pad:contains("Status:")').text();
        if (statusText.includes('Finished')) info.status = 'completed';
        else if (statusText.includes('Publishing')) info.status = 'ongoing';

        const chaptersText = $('div.spaceit_pad:contains("Chapters:")').text();
        const chaptersMatch = chaptersText.match(/Chapters:\s*(\d+)/);
        if (chaptersMatch) info.chapters = parseInt(chaptersMatch[1]);

        const scoreText = $('.score-label').text().trim();
        const scoreMatch = scoreText.match(/([\d.]+)/);
        if (scoreMatch) info.rating = parseFloat(scoreMatch[1]);

        info.coverImage = $('img[itemprop="image"]').attr('data-src') || 
                       $('img[itemprop="image"]').attr('src');

        info.author = $('div.spaceit_pad:contains("Authors:")').text()
          .replace(/Authors?:/, '').split('(')[0].trim();
      }
    }

    // AniList scraping
    else if (url.includes('anilist.co')) {
      info.title = $('h1').first().text().trim();
      
      const altTitles: string[] = [];
      $('.data-set .value').each((_, el) => {
        const text = $(el).text().trim();
        if (text && text !== info.title) altTitles.push(text);
      });
      info.alternativeTitles = altTitles;

      info.synopsis = $('.description').text().trim();

      const genres: string[] = [];
      $('.genres-container .tag').each((_, el) => {
        genres.push($(el).text().trim());
      });
      info.genres = genres;

      const statusText = $('.data-set:contains("Status") .value').text().toLowerCase();
      if (statusText.includes('finished')) info.status = 'completed';
      else if (statusText.includes('releasing')) info.status = 'ongoing';

      const chaptersText = $('.data-set:contains("Chapters") .value').text();
      const chaptersMatch = chaptersText.match(/(\d+)/);
      if (chaptersMatch) info.chapters = parseInt(chaptersMatch[1]);

      const ratingText = $('.score').text();
      const ratingMatch = ratingText.match(/([\d.]+)/);
      if (ratingMatch) info.rating = parseFloat(ratingMatch[1]) / 10; // AniList usa escala 0-100

      info.coverImage = $('.cover').attr('src');
    }

    // Scraping genérico usando AI para extrair informações
    else {
      const pageText = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 5000);
      logger.info('Using AI to extract manga info from generic page', { url });
      
      const model = genAI.getGenerativeModel({ model: config.gemini.model });
      const prompt = `Extract manga information from this webpage text. Return ONLY valid JSON with this structure:
{
  "title": "manga title",
  "alternativeTitles": ["alt1", "alt2"],
  "synopsis": "description",
  "genres": ["genre1", "genre2"],
  "status": "ongoing or completed",
  "author": "author name",
  "chapters": number,
  "rating": number (0-10 scale)
}

If information is not found, omit that field. Webpage text:
${pageText}`;

      const result = await model.generateContent(prompt);
      const aiResponse = result.response.text().trim();
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const extractedInfo = JSON.parse(jsonMatch[0]);
        Object.assign(info, extractedInfo);
      }
    }

    logger.info('Scraping completed', { url, hasTitle: !!info.title });
    return info;
  } catch (error) {
    logger.error('Failed to scrape manga page', { error, url });
    return { sourceUrl: url };
  }
}

/**
 * Traduz informações de mangá do inglês para português usando Gemini
 */
export async function translateMangaInfo(info: ScrapedMangaInfo): Promise<ScrapedMangaInfo> {
  try {
    logger.info('Translating manga info to Portuguese', { hasTitle: !!info.title });

    const model = genAI.getGenerativeModel({ model: config.gemini.model });
    
    const toTranslate = {
      title: info.title,
      alternativeTitles: info.alternativeTitles,
      synopsis: info.synopsis,
      genres: info.genres,
      author: info.author,
      artist: info.artist
    };

    const prompt = `Você é um tradutor especializado em mangás. Traduza do inglês para português brasileiro.

REGRAS:
1. Mantenha títulos de mangá em sua forma original (ex: "Chainsaw Man" permanece "Chainsaw Man")
2. Traduza sinopses completamente
3. Traduza gêneros (Action → Ação, Fantasy → Fantasia, Horror → Terror, etc)
4. Mantenha nomes de autores/artistas originais
5. Retorne APENAS JSON válido, sem explicações

DADOS PARA TRADUZIR:
${JSON.stringify(toTranslate, null, 2)}

RETORNE APENAS ESTE JSON:
{
  "title": "manter titulo original",
  "alternativeTitles": ["traduzir se necessário"],
  "synopsis": "TRADUZIR COMPLETAMENTE",
  "genres": ["TRADUZIR todos os gêneros"],
  "author": "manter original",
  "artist": "manter original"
}`;

    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text().trim();
    
    logger.info('Translation AI response received', { responseLength: aiResponse.length });
    
    // Try to extract JSON from response (may have markdown code blocks)
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      try {
        const translated = JSON.parse(jsonMatch[0]);
        
        logger.info('Translation successful', { 
          translatedSynopsis: !!translated.synopsis,
          translatedGenres: translated.genres?.length || 0
        });
        
        return {
          ...info,
          title: translated.title || info.title,
          alternativeTitles: translated.alternativeTitles || info.alternativeTitles,
          synopsis: translated.synopsis || info.synopsis,
          genres: translated.genres || info.genres,
          author: translated.author || info.author,
          artist: translated.artist || info.artist
        };
      } catch (parseError) {
        logger.error('Failed to parse translation JSON', { parseError, jsonText: jsonMatch[0].substring(0, 200) });
      }
    } else {
      logger.warn('No JSON found in AI translation response', { response: aiResponse.substring(0, 200) });
    }

    return info;
  } catch (error) {
    logger.error('Failed to translate manga info', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return info; // Retorna info original se tradução falhar
  }
}

/**
 * Busca completa: MyAnimeList Search -> Scraping -> Tradução
 */
export async function searchAndScrapeManga(
  mangaName: string,
  translate: boolean = true
): Promise<ScrapedMangaInfo[]> {
  try {
    logger.info('Starting complete manga search', { mangaName, translate });

    const results: ScrapedMangaInfo[] = [];

    // 1. Tentar busca direta no MyAnimeList (melhor opção)
    const malUrl = await searchMangaOnMyAnimeList(mangaName);
    
    if (malUrl) {
      logger.info('Found manga URL on MyAnimeList, scraping...', { url: malUrl });
      const malInfo = await scrapeMangaPage(malUrl);
      
      if (malInfo.title) {
        // Traduzir se solicitado
        const finalInfo = translate ? await translateMangaInfo(malInfo) : malInfo;
        results.push(finalInfo);
        return results; // Retorna imediatamente se encontrou no MAL
      }
    }

    // 2. Fallback: Tentar buscar usando Google Custom Search API
    logger.warn('MyAnimeList search failed, trying Google API', { mangaName });
    const googleUrls = await searchMangaWithGoogleAPI(mangaName);
    
    if (googleUrls.length > 0) {
      // Fazer scraping de todas as URLs do Google (em paralelo)
      const scrapingPromises = googleUrls.map(url => scrapeMangaPage(url));
      const allInfo = await Promise.all(scrapingPromises);

      // Filtrar resultados vazios
      const validInfo = allInfo.filter(info => info.title);

      if (validInfo.length > 0) {
        // Traduzir se solicitado
        if (translate) {
          const translationPromises = validInfo.map(info => translateMangaInfo(info));
          const translatedInfo = await Promise.all(translationPromises);
          return translatedInfo;
        }
        return validInfo;
      }
    }

    // 3. Último recurso: Tentar URL de busca direta
    logger.warn('All searches failed, trying direct search page', { mangaName });
    const searchPageUrl = `https://myanimelist.net/manga.php?q=${encodeURIComponent(mangaName)}`;
    const searchPageInfo = await scrapeMangaPage(searchPageUrl);
    
    if (searchPageInfo.title) {
      const finalInfo = translate ? await translateMangaInfo(searchPageInfo) : searchPageInfo;
      return [finalInfo];
    }

    throw new Error(`Não foi possível encontrar informações para "${mangaName}". Tente um nome mais específico ou em inglês.`);
  } catch (error) {
    logger.error('Failed to search and scrape manga', { error, mangaName });
    throw error;
  }
}

/**
 * Schemas Zod para validação
 */
export const searchMangaSchema = z.object({
  mangaName: z.string().describe('Nome do mangá para buscar'),
  translate: z.boolean().optional().default(true).describe('Se deve traduzir para português (padrão: true)')
});

export const scrapeMangaUrlSchema = z.object({
  url: z.string().url().describe('URL do site de mangá para fazer scraping'),
  translate: z.boolean().optional().default(true).describe('Se deve traduzir para português (padrão: true)')
});

/**
 * Formata informações de mangá em texto estruturado
 */
function formatMangaInfo(info: MangaInfo): string {
  const lines: string[] = [];
  
  lines.push(`📚 **${info.title || 'Título desconhecido'}**`);
  lines.push('');
  
  if (info.alternativeTitles && info.alternativeTitles.length > 0) {
    lines.push(`**Títulos Alternativos:** ${info.alternativeTitles.join(', ')}`);
  }
  
  if (info.author) {
    lines.push(`**Autor:** ${info.author}`);
  }
  
  if (info.artist && info.artist !== info.author) {
    lines.push(`**Artista:** ${info.artist}`);
  }
  
  if (info.status) {
    lines.push(`**Status:** ${info.status}`);
  }
  
  if (info.chapters) {
    lines.push(`**Capítulos:** ${info.chapters}`);
  }
  
  if (info.volumes) {
    lines.push(`**Volumes:** ${info.volumes}`);
  }
  
  if (info.rating) {
    lines.push(`**Avaliação:** ⭐ ${info.rating}/10`);
  }
  
  if (info.genres && info.genres.length > 0) {
    lines.push(`**Gêneros:** ${info.genres.join(', ')}`);
  }
  
  if (info.synopsis) {
    lines.push('');
    lines.push('**Sinopse:**');
    lines.push(info.synopsis);
  }
  
  if (info.coverImage) {
    lines.push('');
    lines.push(`**Imagem de Capa:** ${info.coverImage}`);
  }
  
  if (info.sourceUrl) {
    lines.push('');
    lines.push(`**Fonte:** ${info.sourceUrl}`);
  }
  
  return lines.join('\n');
}

/**
 * Tool handlers para MCP - Formato compatível com outras tools
 */
export const mangaScraperTools = {
  search_manga_info: async (params: { mangaName: string; translate?: boolean }) => {
    const results = await searchAndScrapeManga(params.mangaName, params.translate ?? true);
    
    if (results.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Não foram encontradas informações para "${params.mangaName}". Tente um nome mais específico ou em inglês.`
          }
        ],
        isError: true
      };
    }
    
    // Formata as informações em texto estruturado
    const formattedResults = results.map((info, index) => {
      if (results.length > 1) {
        return `\n**Resultado ${index + 1}:**\n\n${formatMangaInfo(info)}`;
      }
      return formatMangaInfo(info);
    }).join('\n\n---\n');
    
    const header = results.length === 1 
      ? `✅ Informações encontradas para "${params.mangaName}":\n\n`
      : `✅ Encontradas ${results.length} fontes de informação para "${params.mangaName}":\n`;
    
    return {
      content: [
        {
          type: 'text',
          text: header + formattedResults
        }
      ],
      isError: false
    };
  },

  scrape_manga_url: async (params: { url: string; translate?: boolean }) => {
    let info = await scrapeMangaPage(params.url);
    
    if ((params.translate ?? true) && info.title) {
      info = await translateMangaInfo(info);
    }

    if (!info.title) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Não foi possível extrair informações de ${params.url}`
          }
        ],
        isError: true
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `✅ Informações extraídas de ${params.url}:\n\n${formatMangaInfo(info)}`
        }
      ],
      isError: false
    };
  }
};
