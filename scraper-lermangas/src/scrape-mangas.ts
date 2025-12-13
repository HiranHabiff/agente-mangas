/**
 * Script 2: Scrape de mangás e salvamento no banco de dados
 *
 * - Lê o arquivo de links
 * - Para cada link, extrai os dados do mangá
 * - Verifica se já existe no banco (por URL ou título)
 * - Se existe: atualiza campos vazios
 * - Se não existe: cria novo registro
 * - Baixa a imagem da capa
 *
 * Uso:
 *   npx tsx src/scrape-mangas.ts          # Processa todos
 *   npx tsx src/scrape-mangas.ts --test   # Processa apenas 5 mangás
 *   npx tsx src/scrape-mangas.ts --limit=20  # Processa 20 mangás
 */

import { readFileSync, existsSync, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { resolve, extname } from 'path';
import axios from 'axios';
import pg from 'pg';
import { extractMangaData, MangaData } from './extract.js';
import { CONFIG, delay, log } from './config.js';

const { Pool } = pg;

// Pool de conexão com o banco
const pool = new Pool({
  host: CONFIG.DB.host,
  port: CONFIG.DB.port,
  database: CONFIG.DB.database,
  user: CONFIG.DB.user,
  password: CONFIG.DB.password,
});

// Estatísticas
const stats = {
  total: 0,
  processed: 0,
  created: 0,
  updated: 0,
  skipped: 0,
  errors: 0,
  imagesDownloaded: 0,
};

/**
 * Lê os links do arquivo .md
 */
function readLinks(filepath: string): string[] {
  if (!existsSync(filepath)) {
    throw new Error(`Arquivo não encontrado: ${filepath}`);
  }

  const content = readFileSync(filepath, 'utf-8');
  const lines = content.split('\n');

  // Filtrar apenas URLs válidas de mangá
  const links = lines
    .map(line => line.trim())
    .filter(line => {
      // Deve começar com a URL base de mangá
      if (!line.startsWith('https://lermangas.me/manga/')) return false;

      // Excluir URLs inválidas
      if (line.includes('?')) return false; // Parâmetros de query
      if (line === 'https://lermangas.me/manga/') return false; // Página de listagem
      if (line.includes('-genre')) return false; // Páginas de gênero
      if (line.endsWith('/fim/')) return false; // Páginas de fim

      // Verificar se tem um slug válido (não pode ser só /manga/)
      const slug = line.replace('https://lermangas.me/manga/', '').replace(/\/$/, '');
      if (!slug || slug.length === 0) return false;

      return true;
    });

  return [...new Set(links)]; // Remover duplicatas
}

/**
 * Busca mangá no banco por URL ou título
 */
async function findExistingManga(url: string, title: string): Promise<{ id: string; hasImage: boolean } | null> {
  // Primeiro tenta por URL
  let result = await pool.query(
    'SELECT id, image_filename FROM mangas WHERE url = $1 AND deleted_at IS NULL',
    [url]
  );

  if (result.rows.length > 0) {
    return {
      id: result.rows[0].id,
      hasImage: !!result.rows[0].image_filename
    };
  }

  // Depois tenta por título (case insensitive)
  result = await pool.query(
    'SELECT id, image_filename FROM mangas WHERE LOWER(primary_title) = LOWER($1) AND deleted_at IS NULL',
    [title]
  );

  if (result.rows.length > 0) {
    return {
      id: result.rows[0].id,
      hasImage: !!result.rows[0].image_filename
    };
  }

  // Tenta por nome alternativo
  result = await pool.query(
    `SELECT m.id, m.image_filename FROM mangas m
     JOIN manga_names mn ON m.id = mn.manga_id
     WHERE LOWER(mn.name) = LOWER($1) AND m.deleted_at IS NULL`,
    [title]
  );

  if (result.rows.length > 0) {
    return {
      id: result.rows[0].id,
      hasImage: !!result.rows[0].image_filename
    };
  }

  return null;
}

/**
 * Cria novo mangá no banco
 */
async function createManga(data: MangaData): Promise<string> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Inserir mangá
    const result = await client.query(
      `INSERT INTO mangas (primary_title, url, image_url, synopsis, status, rating, total_chapters)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        data.title,
        data.url,
        data.imageUrl,
        data.synopsis,
        'plan_to_read', // Status padrão
        data.rating,
        data.totalChapters || null,
      ]
    );

    const mangaId = result.rows[0].id;

    // Inserir nomes alternativos
    if (data.alternativeNames.length > 0) {
      for (const name of data.alternativeNames) {
        await client.query(
          'INSERT INTO manga_names (manga_id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [mangaId, name]
        );
      }
    }

    // Inserir tags (gêneros)
    if (data.genres.length > 0) {
      for (const genre of data.genres) {
        // Garantir que a tag existe
        await client.query(
          'INSERT INTO tags (name, category) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
          [genre, 'genre']
        );

        // Linkar tag ao mangá
        await client.query(
          `INSERT INTO manga_tags (manga_id, tag_id)
           SELECT $1, id FROM tags WHERE name = $2
           ON CONFLICT DO NOTHING`,
          [mangaId, genre]
        );
      }
    }

    await client.query('COMMIT');
    return mangaId;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Atualiza mangá existente (apenas campos vazios)
 */
async function updateManga(mangaId: string, data: MangaData): Promise<boolean> {
  const client = await pool.connect();
  let updated = false;

  try {
    await client.query('BEGIN');

    // Buscar dados atuais
    const current = await client.query(
      'SELECT * FROM mangas WHERE id = $1',
      [mangaId]
    );

    if (current.rows.length === 0) {
      throw new Error('Mangá não encontrado');
    }

    const manga = current.rows[0];
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Atualizar URL se não tiver
    if (!manga.url && data.url) {
      updates.push(`url = $${paramIndex++}`);
      values.push(data.url);
    }

    // Atualizar image_url se não tiver
    if (!manga.image_url && data.imageUrl) {
      updates.push(`image_url = $${paramIndex++}`);
      values.push(data.imageUrl);
    }

    // Atualizar synopsis se não tiver
    if (!manga.synopsis && data.synopsis) {
      updates.push(`synopsis = $${paramIndex++}`);
      values.push(data.synopsis);
    }

    // Atualizar total_chapters se não tiver ou for maior
    if (data.totalChapters && (!manga.total_chapters || data.totalChapters > manga.total_chapters)) {
      updates.push(`total_chapters = $${paramIndex++}`);
      values.push(data.totalChapters);
    }

    // Atualizar rating se não tiver
    if (!manga.rating && data.rating) {
      updates.push(`rating = $${paramIndex++}`);
      values.push(data.rating);
    }

    if (updates.length > 0) {
      values.push(mangaId);
      await client.query(
        `UPDATE mangas SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
        values
      );
      updated = true;
    }

    // Adicionar nomes alternativos que não existem
    if (data.alternativeNames.length > 0) {
      for (const name of data.alternativeNames) {
        const result = await client.query(
          'INSERT INTO manga_names (manga_id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING id',
          [mangaId, name]
        );
        if (result.rowCount && result.rowCount > 0) {
          updated = true;
        }
      }
    }

    // Adicionar tags que não existem
    if (data.genres.length > 0) {
      for (const genre of data.genres) {
        await client.query(
          'INSERT INTO tags (name, category) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
          [genre, 'genre']
        );

        const result = await client.query(
          `INSERT INTO manga_tags (manga_id, tag_id)
           SELECT $1, id FROM tags WHERE name = $2
           ON CONFLICT DO NOTHING RETURNING manga_id`,
          [mangaId, genre]
        );
        if (result.rowCount && result.rowCount > 0) {
          updated = true;
        }
      }
    }

    await client.query('COMMIT');
    return updated;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Baixa a imagem da capa
 */
async function downloadImage(mangaId: string, imageUrl: string): Promise<string | null> {
  try {
    const response = await axios.get(imageUrl, {
      headers: CONFIG.HEADERS,
      responseType: 'stream',
      timeout: 30000,
    });

    // Determinar extensão
    const contentType = response.headers['content-type'];
    let ext = '.jpg';
    if (contentType?.includes('png')) ext = '.png';
    else if (contentType?.includes('webp')) ext = '.webp';
    else if (contentType?.includes('gif')) ext = '.gif';
    else {
      // Tentar da URL
      const urlExt = extname(new URL(imageUrl).pathname).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(urlExt)) {
        ext = urlExt === '.jpeg' ? '.jpg' : urlExt;
      }
    }

    const filename = `${mangaId}${ext}`;
    const filepath = resolve(CONFIG.IMAGES_PATH, filename);

    // Salvar arquivo
    const writer = createWriteStream(filepath);
    await pipeline(response.data, writer);

    // Atualizar banco com o filename
    await pool.query(
      'UPDATE mangas SET image_filename = $1 WHERE id = $2',
      [filename, mangaId]
    );

    return filename;

  } catch (error) {
    log(`Erro ao baixar imagem: ${error}`, 'error');
    return null;
  }
}

/**
 * Processa um único mangá
 */
async function processManga(url: string, index: number, total: number): Promise<void> {
  try {
    log(`[${index}/${total}] Processando: ${url}`);

    // Extrair dados
    const data = await extractMangaData(url);

    if (!data.title) {
      log(`  Título não encontrado, pulando...`, 'warn');
      stats.skipped++;
      return;
    }

    // Verificar se já existe
    const existing = await findExistingManga(url, data.title);

    let mangaId: string;
    let needsImage = false;

    if (existing) {
      // Atualizar existente
      const wasUpdated = await updateManga(existing.id, data);
      mangaId = existing.id;
      needsImage = !existing.hasImage;

      if (wasUpdated) {
        log(`  Atualizado: ${data.title}`, 'success');
        stats.updated++;
      } else {
        log(`  Sem alterações: ${data.title}`, 'info');
        stats.skipped++;
      }
    } else {
      // Criar novo
      mangaId = await createManga(data);
      needsImage = true;
      log(`  Criado: ${data.title}`, 'success');
      stats.created++;
    }

    // Baixar imagem se necessário
    if (needsImage && data.imageUrl) {
      const filename = await downloadImage(mangaId, data.imageUrl);
      if (filename) {
        log(`  Imagem baixada: ${filename}`, 'success');
        stats.imagesDownloaded++;
      }
    }

    stats.processed++;

  } catch (error) {
    log(`  Erro: ${error}`, 'error');
    stats.errors++;
  }
}

/**
 * Função principal
 */
async function main() {
  const startTime = Date.now();

  console.log('\n========================================');
  console.log('   SCRAPER LERMANGAS.ME - IMPORTAÇÃO');
  console.log('========================================\n');

  // Argumentos
  const args = process.argv.slice(2);
  const testMode = args.includes('--test');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = testMode ? 5 : (limitArg ? parseInt(limitArg.split('=')[1]) : Infinity);

  if (testMode) {
    log('MODO DE TESTE: processando apenas 5 mangás', 'warn');
  } else if (limitArg) {
    log(`Limite definido: ${limit} mangás`, 'warn');
  }

  try {
    // Testar conexão com o banco
    log('Testando conexão com o banco...');
    await pool.query('SELECT NOW()');
    log('Conexão OK!', 'success');

    // Ler links
    log(`Lendo links de: ${CONFIG.LINKS_FILE}`);
    const allLinks = readLinks(CONFIG.LINKS_FILE);
    stats.total = Math.min(allLinks.length, limit);
    log(`Total de links válidos: ${allLinks.length}, processando: ${stats.total}`, 'info');

    // Processar mangás
    const linksToProcess = allLinks.slice(0, limit);

    for (let i = 0; i < linksToProcess.length; i++) {
      await processManga(linksToProcess[i], i + 1, stats.total);

      // Delay entre requisições
      if (i < linksToProcess.length - 1) {
        await delay(CONFIG.DELAY_BETWEEN_REQUESTS);
      }

      // Status a cada 10 mangás
      if ((i + 1) % 10 === 0) {
        console.log(`\n--- Progresso: ${i + 1}/${stats.total} ---`);
        console.log(`    Criados: ${stats.created}, Atualizados: ${stats.updated}, Erros: ${stats.errors}\n`);
      }
    }

    // Relatório final
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('\n========================================');
    console.log('   IMPORTAÇÃO FINALIZADA');
    console.log('========================================');
    console.log(`   Total processado: ${stats.processed}`);
    console.log(`   Novos criados: ${stats.created}`);
    console.log(`   Atualizados: ${stats.updated}`);
    console.log(`   Pulados (sem alteração): ${stats.skipped}`);
    console.log(`   Erros: ${stats.errors}`);
    console.log(`   Imagens baixadas: ${stats.imagesDownloaded}`);
    console.log(`   Tempo total: ${duration}s`);
    console.log('========================================\n');

  } catch (error) {
    log(`Erro fatal: ${error}`, 'error');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
