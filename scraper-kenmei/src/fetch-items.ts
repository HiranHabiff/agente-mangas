import axios from 'axios';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { CONFIG, delay, log, formatTime } from './config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ERRORS_FILE = resolve(__dirname, '../errors.txt');

interface PageData {
  data: Array<{
    id: number;
    slug: string;
    title: string;
  }>;
  pagy: {
    page: number;
    pages: number;
  };
}

interface ErrorEntry {
  slug: string;
  error: string;
  timestamp: string;
}

interface Stats {
  downloaded: number;
  skipped: number;
  errors: number;
  startTime: number;
  errorList: ErrorEntry[];
}

function loadAllSlugs(): string[] {
  const slugs: string[] = [];
  const files = readdirSync(CONFIG.DATA_PAGES_DIR)
    .filter((f) => f.startsWith('page-') && f.endsWith('.json'))
    .sort((a, b) => {
      const numA = parseInt(a.replace('page-', '').replace('.json', ''));
      const numB = parseInt(b.replace('page-', '').replace('.json', ''));
      return numA - numB;
    });

  log(`Encontrados ${files.length} arquivos de páginas`);

  for (const file of files) {
    const filePath = resolve(CONFIG.DATA_PAGES_DIR, file);
    try {
      const content = readFileSync(filePath, 'utf-8');
      const data: PageData = JSON.parse(content);

      if (data.data && Array.isArray(data.data)) {
        for (const item of data.data) {
          if (item.slug && !slugs.includes(item.slug)) {
            slugs.push(item.slug);
          }
        }
      }
    } catch (error) {
      log(`Erro ao ler ${file}: ${error instanceof Error ? error.message : 'Erro'}`);
    }
  }

  return slugs;
}

function addError(stats: Stats, slug: string, errorMessage: string) {
  stats.errors++;
  const entry: ErrorEntry = {
    slug,
    error: errorMessage,
    timestamp: new Date().toISOString(),
  };
  stats.errorList.push(entry);

  // Salvar imediatamente em tempo real (append ao arquivo)
  const errorLine = `${slug}\n`;
  if (stats.errorList.length === 1) {
    // Primeiro erro: criar/sobrescrever arquivo
    writeFileSync(ERRORS_FILE, errorLine, 'utf-8');
  } else {
    // Erros subsequentes: append
    const currentContent = readFileSync(ERRORS_FILE, 'utf-8');
    writeFileSync(ERRORS_FILE, currentContent + errorLine, 'utf-8');
  }

  // Atualizar também o JSON detalhado em tempo real
  const errorsLogFile = resolve(__dirname, '../errors-details.json');
  writeFileSync(errorsLogFile, JSON.stringify(stats.errorList, null, 2), 'utf-8');
}

function printErrorsSummary(stats: Stats) {
  if (stats.errorList.length === 0) return;
  log(`Erros salvos em: errors.txt (${stats.errorList.length} slugs)`);
  log(`Detalhes salvos em: errors-details.json`);
}

async function fetchItem(
  slug: string,
  index: number,
  total: number,
  stats: Stats
): Promise<boolean> {
  const filePath = resolve(CONFIG.DATA_ITEMS_DIR, `${slug}.json`);

  // Verificar se já existe
  if (existsSync(filePath)) {
    stats.skipped++;
    return true;
  }

  let retries = 0;

  while (retries < CONFIG.MAX_RETRIES) {
    try {
      const url = CONFIG.API_N2(slug);
      const response = await axios.get(url, {
        headers: CONFIG.HEADERS,
        timeout: 30000,
      });

      // Salvar JSON
      writeFileSync(filePath, JSON.stringify(response.data, null, 2), 'utf-8');

      stats.downloaded++;
      log(`[${index}/${total}] Baixado ${slug}.json`);
      return true;
    } catch (error) {
      retries++;

      if (axios.isAxiosError(error) && error.response?.status === 404) {
        log(`[${index}/${total}] 404 - ${slug} não encontrado`);
        addError(stats, slug, '404 - Not Found');
        return false;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';

      if (retries < CONFIG.MAX_RETRIES) {
        log(
          `[${index}/${total}] Erro: ${errorMessage}. Tentativa ${retries}/${CONFIG.MAX_RETRIES}...`
        );
        await delay(CONFIG.RETRY_DELAY);
      } else {
        log(`[${index}/${total}] FALHOU: ${slug} - ${errorMessage}`);
        addError(stats, slug, errorMessage);
        return false;
      }
    }
  }

  return false;
}

async function main() {
  console.log('========================================');
  console.log('   KENMEI SCRAPER - FETCH ITEMS (N2)');
  console.log('========================================\n');

  // Verificar se existem páginas baixadas
  if (!existsSync(CONFIG.DATA_PAGES_DIR)) {
    console.error('ERRO: Diretório data-pages não existe.');
    console.error('Execute primeiro: npm run fetch-pages');
    process.exit(1);
  }

  // Criar diretório de itens se não existir
  if (!existsSync(CONFIG.DATA_ITEMS_DIR)) {
    mkdirSync(CONFIG.DATA_ITEMS_DIR, { recursive: true });
    log(`Diretório criado: ${CONFIG.DATA_ITEMS_DIR}`);
  }

  // Carregar todos os slugs
  log('Carregando slugs das páginas...');
  const slugs = loadAllSlugs();

  if (slugs.length === 0) {
    console.error('ERRO: Nenhum slug encontrado nos arquivos de páginas.');
    console.error('Execute primeiro: npm run fetch-pages');
    process.exit(1);
  }

  const stats: Stats = {
    downloaded: 0,
    skipped: 0,
    errors: 0,
    startTime: Date.now(),
    errorList: [],
  };

  const total = slugs.length;

  log(`Total de slugs únicos: ${total}`);
  log(`Delay entre requisições: ${CONFIG.DELAY_BETWEEN_REQUESTS}ms\n`);

  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i];
    await fetchItem(slug, i + 1, total, stats);

    // Delay entre requisições (não aplica se foi skipped)
    if (i < slugs.length - 1) {
      const nextFilePath = resolve(CONFIG.DATA_ITEMS_DIR, `${slugs[i + 1]}.json`);
      if (!existsSync(nextFilePath)) {
        // Próximo item precisa ser baixado, aplicar delay
        await delay(CONFIG.DELAY_BETWEEN_REQUESTS);
      }
    }

    // Log de progresso a cada 500 itens
    if ((i + 1) % 500 === 0) {
      const elapsed = Date.now() - stats.startTime;
      const rate = stats.downloaded / (elapsed / 1000 / 60); // itens por minuto
      const remaining = total - (i + 1);
      const eta = remaining / (rate / 60); // segundos restantes

      log(
        `--- Progresso: ${i + 1}/${total} | Baixados: ${stats.downloaded} | Pulados: ${stats.skipped} | Erros: ${stats.errors} | Taxa: ${rate.toFixed(1)}/min | ETA: ${formatTime(eta * 1000)} ---`
      );
    }
  }

  const totalTime = Date.now() - stats.startTime;

  // Mostrar resumo de erros (já foram salvos em tempo real)
  printErrorsSummary(stats);

  console.log('\n========================================');
  console.log('   DOWNLOAD FINALIZADO');
  console.log('========================================');
  console.log(`   Total itens: ${total}`);
  console.log(`   Baixados: ${stats.downloaded}`);
  console.log(`   Pulados (já existiam): ${stats.skipped}`);
  console.log(`   Erros: ${stats.errors}`);
  console.log(`   Tempo total: ${formatTime(totalTime)}`);
  if (stats.errors > 0) {
    console.log(`   Arquivo de erros: errors.txt`);
  }
  console.log('========================================\n');
}

main().catch(console.error);
