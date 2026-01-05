import axios from 'axios';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { CONFIG, delay, log, formatTime } from './config.js';

interface Stats {
  downloaded: number;
  skipped: number;
  errors: number;
  startTime: number;
}

async function fetchPage(
  page: number,
  stats: Stats,
  total: number
): Promise<boolean> {
  const filePath = resolve(CONFIG.DATA_PAGES_DIR, `page-${page}.json`);

  // Verificar se já existe
  if (existsSync(filePath)) {
    stats.skipped++;
    return true;
  }

  let retries = 0;

  while (retries < CONFIG.MAX_RETRIES) {
    try {
      const url = CONFIG.API_N1(page);
      const response = await axios.get(url, {
        headers: CONFIG.HEADERS,
        timeout: 30000,
      });

      // Salvar JSON
      writeFileSync(filePath, JSON.stringify(response.data, null, 2), 'utf-8');

      stats.downloaded++;
      log(`[${page}/${total}] Baixado page-${page}.json`);
      return true;
    } catch (error) {
      retries++;
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';

      if (retries < CONFIG.MAX_RETRIES) {
        log(
          `[${page}/${total}] Erro: ${errorMessage}. Tentativa ${retries}/${CONFIG.MAX_RETRIES}...`
        );
        await delay(CONFIG.RETRY_DELAY);
      } else {
        log(`[${page}/${total}] FALHOU: ${errorMessage}`);
        stats.errors++;
        return false;
      }
    }
  }

  return false;
}

async function main() {
  console.log('========================================');
  console.log('   KENMEI SCRAPER - FETCH PAGES (N1)');
  console.log('========================================\n');

  // Criar diretório se não existir
  if (!existsSync(CONFIG.DATA_PAGES_DIR)) {
    mkdirSync(CONFIG.DATA_PAGES_DIR, { recursive: true });
    log(`Diretório criado: ${CONFIG.DATA_PAGES_DIR}`);
  }

  const stats: Stats = {
    downloaded: 0,
    skipped: 0,
    errors: 0,
    startTime: Date.now(),
  };

  const totalPages = CONFIG.TOTAL_PAGES;

  log(`Iniciando download de ${totalPages} páginas...`);
  log(`Delay entre requisições: ${CONFIG.DELAY_BETWEEN_REQUESTS}ms\n`);

  for (let page = 1; page <= totalPages; page++) {
    await fetchPage(page, stats, totalPages);

    // Delay entre requisições (não aplica delay se foi skipped)
    if (page < totalPages && stats.skipped === 0) {
      await delay(CONFIG.DELAY_BETWEEN_REQUESTS);
    } else if (page < totalPages) {
      // Se foi skipped, verificar próxima página sem delay
      const nextFilePath = resolve(
        CONFIG.DATA_PAGES_DIR,
        `page-${page + 1}.json`
      );
      if (!existsSync(nextFilePath)) {
        // Próxima página precisa ser baixada, aplicar delay
        await delay(CONFIG.DELAY_BETWEEN_REQUESTS);
      }
    }

    // Log de progresso a cada 100 páginas
    if (page % 100 === 0) {
      const elapsed = Date.now() - stats.startTime;
      const rate = stats.downloaded / (elapsed / 1000 / 60); // páginas por minuto
      log(
        `--- Progresso: ${page}/${totalPages} | Baixados: ${stats.downloaded} | Pulados: ${stats.skipped} | Erros: ${stats.errors} | Taxa: ${rate.toFixed(1)}/min ---`
      );
    }
  }

  const totalTime = Date.now() - stats.startTime;

  console.log('\n========================================');
  console.log('   DOWNLOAD FINALIZADO');
  console.log('========================================');
  console.log(`   Total páginas: ${totalPages}`);
  console.log(`   Baixados: ${stats.downloaded}`);
  console.log(`   Pulados (já existiam): ${stats.skipped}`);
  console.log(`   Erros: ${stats.errors}`);
  console.log(`   Tempo total: ${formatTime(totalTime)}`);
  console.log('========================================\n');
}

main().catch(console.error);
