/**
 * Script 1: Coletar todos os links de mangás do site lermangas.me
 *
 * - Lê a home e extrai os links
 * - Navega pelas páginas 2-100 e extrai mais links
 * - Salva todos os links únicos em um arquivo .md
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { CONFIG, delay, log } from './config.js';

// Set de links para evitar duplicatas
const collectedLinks = new Set<string>();

/**
 * Extrai links de mangás de uma página HTML
 */
function extractMangaLinks(html: string): string[] {
  const $ = cheerio.load(html);
  const links: string[] = [];

  // Buscar todos os links que apontam para /manga/
  $('a[href*="/manga/"]').each((_, element) => {
    const href = $(element).attr('href');
    if (href) {
      // Filtrar apenas URLs de mangá (não capítulos)
      // Padrão: /manga/nome-do-manga/ (sem /capitulo-)
      if (href.includes('/manga/') && !href.includes('/capitulo-') && !href.includes('/chapter-')) {
        // Normalizar URL
        let normalizedUrl = href;

        // Garantir que termina com /
        if (!normalizedUrl.endsWith('/')) {
          normalizedUrl += '/';
        }

        // Garantir URL completa
        if (normalizedUrl.startsWith('/')) {
          normalizedUrl = CONFIG.BASE_URL + normalizedUrl;
        }

        links.push(normalizedUrl);
      }
    }
  });

  return links;
}

/**
 * Busca uma página e extrai os links
 */
async function fetchPageLinks(url: string, pageNum: number | string): Promise<string[]> {
  try {
    log(`Buscando página ${pageNum}: ${url}`);

    const response = await axios.get(url, {
      headers: CONFIG.HEADERS,
      timeout: 30000,
    });

    const links = extractMangaLinks(response.data);
    const uniqueNewLinks = links.filter(link => !collectedLinks.has(link));

    // Adicionar ao set global
    uniqueNewLinks.forEach(link => collectedLinks.add(link));

    log(`Página ${pageNum}: encontrados ${links.length} links, ${uniqueNewLinks.length} novos`, 'success');

    return uniqueNewLinks;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        log(`Página ${pageNum} não existe (404)`, 'warn');
        return [];
      }
      log(`Erro na página ${pageNum}: ${error.message}`, 'error');
    } else {
      log(`Erro na página ${pageNum}: ${error}`, 'error');
    }
    return [];
  }
}

/**
 * Salva os links em arquivo .md
 */
function saveLinks(links: string[], filename: string): void {
  // Garantir que o diretório existe
  const dir = dirname(filename);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Criar conteúdo do arquivo
  const content = [
    `# Links de Mangás - lermangas.me`,
    ``,
    `> Coletados em: ${new Date().toLocaleString('pt-BR')}`,
    `> Total de links: ${links.length}`,
    ``,
    `## Links`,
    ``,
    ...links.map(link => link),
    ``,
  ].join('\n');

  writeFileSync(filename, content, 'utf-8');
  log(`Links salvos em: ${filename}`, 'success');
}

/**
 * Função principal
 */
async function main() {
  const startTime = Date.now();

  console.log('\n========================================');
  console.log('   SCRAPER LERMANGAS.ME - COLETA DE LINKS');
  console.log('========================================\n');

  // Argumentos da linha de comando
  const args = process.argv.slice(2);
  const testMode = args.includes('--test');
  const maxPages = testMode ? 3 : CONFIG.MAX_PAGES;

  if (testMode) {
    log('MODO DE TESTE: coletando apenas 3 páginas', 'warn');
  }

  try {
    // 1. Buscar a home
    log('Iniciando coleta de links...', 'info');
    await fetchPageLinks(CONFIG.HOME_URL, 'home');

    // 2. Buscar páginas 2 até maxPages
    let consecutiveEmpty = 0;
    const maxConsecutiveEmpty = 3;

    for (let page = 2; page <= maxPages; page++) {
      await delay(CONFIG.DELAY_BETWEEN_PAGES);

      const newLinks = await fetchPageLinks(CONFIG.PAGINATION_URL(page), page);

      // Se não encontrou novos links
      if (newLinks.length === 0) {
        consecutiveEmpty++;
        if (consecutiveEmpty >= maxConsecutiveEmpty) {
          log(`${maxConsecutiveEmpty} páginas sem novos links. Finalizando...`, 'warn');
          break;
        }
      } else {
        consecutiveEmpty = 0;
      }

      // Status a cada 10 páginas
      if (page % 10 === 0) {
        log(`Progresso: página ${page}/${maxPages}, total coletado: ${collectedLinks.size} links`, 'info');
      }
    }

    // 3. Salvar resultados
    const allLinks = Array.from(collectedLinks).sort();
    saveLinks(allLinks, CONFIG.LINKS_FILE);

    // 4. Relatório final
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('\n========================================');
    console.log('   COLETA FINALIZADA');
    console.log('========================================');
    console.log(`   Total de links únicos: ${allLinks.length}`);
    console.log(`   Tempo total: ${duration}s`);
    console.log(`   Arquivo: ${CONFIG.LINKS_FILE}`);
    console.log('========================================\n');

  } catch (error) {
    log(`Erro fatal: ${error}`, 'error');
    process.exit(1);
  }
}

// Executar
main();
