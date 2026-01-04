/**
 * Script de Importação - Dados Kenmei -> Banco de Dados
 *
 * Importa/atualiza mangás a partir dos arquivos JSON em data-items/
 * seguindo as regras definidas em annotations.md
 *
 * Uso: node import-kenmei.js [--dry-run] [--limit=N] [--file=nome.json] [--skip-images] [--reset]
 *
 * Opções:
 *   --dry-run      Simula a importação sem executar queries
 *   --limit=N      Limita o processamento a N arquivos
 *   --file=X       Processa apenas o arquivo especificado
 *   --skip-images  Não faz download das imagens
 *   --reset        Ignora checkpoint e processa tudo do zero
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const CONFIG = {
  dataDir: path.join(__dirname, 'data-items'),
  imagesDir: path.join(__dirname, '..', 'storage', 'images'),
  checkpointFile: path.join(__dirname, '.import-checkpoint.json'),
  db: {
    host: 'localhost',
    port: 5432,
    database: 'manga_db',
    user: 'manga_user',
    password: 'manga123'
  }
};

// ============================================================================
// CACHE DE LOOKUP TABLES
// ============================================================================

const CACHE = {
  status: new Map(),      // name_english -> id
  types: new Map(),       // name_english -> id
  ratings: new Map(),     // name_english -> id
  genres: new Map(),      // name_english -> id
  themes: new Map(),      // name_english -> id
  characters: new Map(),  // name_english -> id
  warnings: new Map(),    // name_english -> id
  sites: new Map()        // name -> id
};

// ============================================================================
// ESTATÍSTICAS
// ============================================================================

const STATS = {
  processed: 0,
  created: 0,
  updated: 0,
  skipped: 0,
  errors: 0,
  imagesDownloaded: 0,
  imagesSkipped: 0,
  imagesFailed: 0,
  startTime: null,
  endTime: null
};

// ============================================================================
// UTILITÁRIOS
// ============================================================================

/**
 * Parse de argumentos da linha de comando
 */
function parseArgs() {
  const args = {
    dryRun: false,
    limit: null,
    file: null,
    skipImages: false,
    reset: false
  };

  process.argv.slice(2).forEach(arg => {
    if (arg === '--dry-run') {
      args.dryRun = true;
    } else if (arg === '--skip-images') {
      args.skipImages = true;
    } else if (arg === '--reset') {
      args.reset = true;
    } else if (arg.startsWith('--limit=')) {
      args.limit = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--file=')) {
      args.file = arg.split('=')[1];
    }
  });

  return args;
}

// ============================================================================
// CHECKPOINT (PROGRESSO)
// ============================================================================

/**
 * Carrega checkpoint do arquivo
 * Retorna Set com arquivos já processados
 */
function loadCheckpoint() {
  try {
    if (fs.existsSync(CONFIG.checkpointFile)) {
      const content = fs.readFileSync(CONFIG.checkpointFile, 'utf-8');
      const data = JSON.parse(content);
      log('info', `Checkpoint encontrado: ${data.processedFiles.length} arquivos já processados`);
      return {
        processedFiles: new Set(data.processedFiles),
        stats: data.stats || {}
      };
    }
  } catch (err) {
    log('warning', `Erro ao carregar checkpoint: ${err.message}`);
  }
  return { processedFiles: new Set(), stats: {} };
}

/**
 * Salva checkpoint após cada manga processado
 */
function saveCheckpoint(processedFiles, stats) {
  try {
    const data = {
      lastUpdate: new Date().toISOString(),
      processedFiles: Array.from(processedFiles),
      stats: {
        processed: stats.processed,
        created: stats.created,
        updated: stats.updated,
        errors: stats.errors,
        imagesDownloaded: stats.imagesDownloaded,
        imagesSkipped: stats.imagesSkipped,
        imagesFailed: stats.imagesFailed
      }
    };
    fs.writeFileSync(CONFIG.checkpointFile, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    log('warning', `Erro ao salvar checkpoint: ${err.message}`);
  }
}

/**
 * Remove arquivo de checkpoint (quando finaliza com sucesso)
 */
function clearCheckpoint() {
  try {
    if (fs.existsSync(CONFIG.checkpointFile)) {
      fs.unlinkSync(CONFIG.checkpointFile);
      log('info', 'Checkpoint removido (importação completa)');
    }
  } catch (err) {
    log('warning', `Erro ao remover checkpoint: ${err.message}`);
  }
}

/**
 * Logger com timestamp
 */
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📘',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    debug: '🔍'
  }[level] || '📝';

  console.log(`[${timestamp}] ${prefix} ${message}`);
  if (data) {
    console.log('   ', JSON.stringify(data, null, 2).split('\n').join('\n    '));
  }
}

/**
 * Extrai URL de imagem seguindo prioridade definida
 * Prioridade: webp.small > jpeg.small > webp.large > jpeg.large
 */
function extractImageUrl(cover) {
  if (!cover) return null;

  if (cover.webp?.small) return cover.webp.small;
  if (cover.jpeg?.small) return cover.jpeg.small;
  if (cover.webp?.large) return cover.webp.large;
  if (cover.jpeg?.large) return cover.jpeg.large;

  return null;
}

/**
 * Converte score para número válido (0-10) ou null
 */
function parseScore(score) {
  if (!score || score === 'N/A' || score === 'n/a') return null;
  const num = parseFloat(score);
  if (isNaN(num) || num < 0 || num > 10) return null;
  return num;
}

/**
 * Extrai extensão do arquivo a partir da URL
 */
function getExtensionFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    const ext = path.extname(pathname).toLowerCase();
    // Normalizar extensões
    if (ext === '.webp') return '.webp';
    if (ext === '.jpeg' || ext === '.jpg') return '.jpg';
    if (ext === '.png') return '.png';
    // Default para jpg
    return '.jpg';
  } catch {
    return '.jpg';
  }
}

/**
 * Faz download de uma imagem e salva no diretório de storage
 * O nome do arquivo é o UUID do manga
 */
function downloadImage(url, mangaId) {
  return new Promise((resolve, reject) => {
    const extension = getExtensionFromUrl(url);
    const filename = `${mangaId}${extension}`;
    const filePath = path.join(CONFIG.imagesDir, filename);

    // Verificar se já existe
    if (fs.existsSync(filePath)) {
      STATS.imagesSkipped++;
      resolve({ filename, skipped: true });
      return;
    }

    // Garantir que o diretório existe
    if (!fs.existsSync(CONFIG.imagesDir)) {
      fs.mkdirSync(CONFIG.imagesDir, { recursive: true });
    }

    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filePath);

    const request = protocol.get(url, (response) => {
      // Seguir redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          file.close();
          fs.unlinkSync(filePath);
          downloadImage(redirectUrl, mangaId).then(resolve).catch(reject);
          return;
        }
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(filePath);
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        STATS.imagesDownloaded++;
        resolve({ filename, skipped: false });
      });
    });

    request.on('error', (err) => {
      file.close();
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      STATS.imagesFailed++;
      reject(err);
    });

    // Timeout de 30 segundos
    request.setTimeout(30000, () => {
      request.destroy();
      file.close();
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      STATS.imagesFailed++;
      reject(new Error('Timeout'));
    });
  });
}

/**
 * Processa download da imagem para um manga
 * Retorna o filename se baixou, null caso contrário
 */
async function processImage(pool, mangaId, cover, dryRun = false) {
  const imageUrl = extractImageUrl(cover);
  if (!imageUrl) return null;

  // Verificar se manga já tem imagem local
  const result = await pool.query(
    'SELECT image_filename FROM mangas WHERE id = $1',
    [mangaId]
  );

  if (result.rows.length > 0 && result.rows[0].image_filename) {
    // Já tem imagem, não precisa baixar
    return null;
  }

  if (dryRun) {
    log('debug', `[DRY-RUN] DOWNLOAD image: ${imageUrl}`);
    return null;
  }

  try {
    const { filename, skipped } = await downloadImage(imageUrl, mangaId);

    if (!skipped) {
      // Atualizar image_filename no banco
      await pool.query(
        'UPDATE mangas SET image_filename = $1 WHERE id = $2',
        [filename, mangaId]
      );
      log('debug', `  Imagem baixada: ${filename}`);
    }

    return filename;
  } catch (err) {
    log('warning', `  Erro ao baixar imagem: ${err.message}`);
    return null;
  }
}

// ============================================================================
// CACHE LOADER
// ============================================================================

/**
 * Carrega todas as lookup tables em memória
 */
async function loadCache(pool) {
  log('info', 'Carregando cache de lookup tables...');

  // Status
  const statusResult = await pool.query('SELECT id, name_english FROM status');
  statusResult.rows.forEach(row => {
    if (row.name_english) {
      CACHE.status.set(row.name_english.toLowerCase(), row.id);
    }
  });
  log('debug', `  Status: ${CACHE.status.size} registros`);

  // Types
  const typesResult = await pool.query('SELECT id, name_english FROM types');
  typesResult.rows.forEach(row => {
    if (row.name_english) {
      CACHE.types.set(row.name_english.toLowerCase(), row.id);
    }
  });
  log('debug', `  Types: ${CACHE.types.size} registros`);

  // Ratings
  const ratingsResult = await pool.query('SELECT id, name_english FROM ratings');
  ratingsResult.rows.forEach(row => {
    if (row.name_english) {
      CACHE.ratings.set(row.name_english.toLowerCase(), row.id);
    }
  });
  log('debug', `  Ratings: ${CACHE.ratings.size} registros`);

  // Genres
  const genresResult = await pool.query('SELECT id, name_english FROM genres');
  genresResult.rows.forEach(row => {
    if (row.name_english) {
      CACHE.genres.set(row.name_english.toLowerCase(), row.id);
    }
  });
  log('debug', `  Genres: ${CACHE.genres.size} registros`);

  // Themes
  const themesResult = await pool.query('SELECT id, name_english FROM themes');
  themesResult.rows.forEach(row => {
    if (row.name_english) {
      CACHE.themes.set(row.name_english.toLowerCase(), row.id);
    }
  });
  log('debug', `  Themes: ${CACHE.themes.size} registros`);

  // Characters
  const charactersResult = await pool.query('SELECT id, name_english FROM characters');
  charactersResult.rows.forEach(row => {
    if (row.name_english) {
      CACHE.characters.set(row.name_english.toLowerCase(), row.id);
    }
  });
  log('debug', `  Characters: ${CACHE.characters.size} registros`);

  // Warnings
  const warningsResult = await pool.query('SELECT id, name_english FROM warnings');
  warningsResult.rows.forEach(row => {
    if (row.name_english) {
      CACHE.warnings.set(row.name_english.toLowerCase(), row.id);
    }
  });
  log('debug', `  Warnings: ${CACHE.warnings.size} registros`);

  // Sites (usa 'name' ao invés de 'name_english')
  const sitesResult = await pool.query('SELECT id, name FROM sites');
  sitesResult.rows.forEach(row => {
    if (row.name) {
      CACHE.sites.set(row.name.toLowerCase(), row.id);
    }
  });
  log('debug', `  Sites: ${CACHE.sites.size} registros`);

  log('success', 'Cache carregado com sucesso');
}

// ============================================================================
// CRIAÇÃO DE NOVOS REGISTROS EM LOOKUP TABLES
// ============================================================================

/**
 * Obtém ou cria um registro em uma lookup table
 * Se não existir no cache, cria no banco e atualiza o cache
 */
async function getOrCreateLookup(pool, tableName, name, cache, dryRun = false) {
  if (!name) return null;

  const key = name.toLowerCase();

  // Verificar se já existe no cache
  if (cache.has(key)) {
    return cache.get(key);
  }

  // Não existe, criar novo registro
  if (dryRun) {
    log('debug', `[DRY-RUN] CREATE ${tableName}: ${name}`);
    return null;
  }

  try {
    // Inserir novo registro (name e name_english iguais para novos)
    const result = await pool.query(
      `INSERT INTO "${tableName}" (name, name_english)
       VALUES ($1, $1)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [name]
    );

    const newId = result.rows[0].id;
    cache.set(key, newId);
    log('info', `  Novo ${tableName} criado: ${name}`);

    return newId;
  } catch (err) {
    log('warning', `  Erro ao criar ${tableName} "${name}": ${err.message}`);
    return null;
  }
}

/**
 * Obtém ou cria um site
 * Sites usam 'name' ao invés de 'name_english'
 */
async function getOrCreateSite(pool, name, url, dryRun = false) {
  if (!name) return null;

  const key = name.toLowerCase();

  // Verificar se já existe no cache
  if (CACHE.sites.has(key)) {
    return CACHE.sites.get(key);
  }

  // Não existe, criar novo registro
  if (dryRun) {
    log('debug', `[DRY-RUN] CREATE site: ${name}`);
    return null;
  }

  try {
    // Extrair URL base
    let baseUrl = '';
    if (url) {
      try {
        const parsedUrl = new URL(url);
        baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
      } catch {
        baseUrl = url.split('/').slice(0, 3).join('/');
      }
    }

    const result = await pool.query(
      `INSERT INTO sites (name, url, active)
       VALUES ($1, $2, true)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [name, baseUrl]
    );

    const newId = result.rows[0].id;
    CACHE.sites.set(key, newId);
    log('info', `  Novo site criado: ${name}`);

    return newId;
  } catch (err) {
    log('warning', `  Erro ao criar site "${name}": ${err.message}`);
    return null;
  }
}

// ============================================================================
// BUSCA DE MANGA EXISTENTE
// ============================================================================

/**
 * Busca manga existente por título (case-insensitive)
 * Retorna o ID se encontrar, null caso contrário
 */
async function findExistingManga(pool, title, alternativeTitles = []) {
  // Query de busca case-insensitive
  // Usa subquery para permitir ORDER BY com DISTINCT
  const query = `
    SELECT id FROM (
      SELECT DISTINCT m.id, m.last_chapter_read, m.created_at
      FROM mangas m
      LEFT JOIN manga_names mn ON m.id = mn.manga_id
      WHERE m.deleted_at IS NULL AND (
        -- Busca exata pelo titulo principal (case-insensitive)
        LOWER(m.primary_title) = LOWER($1)
        OR LOWER(mn.name) = LOWER($1)
        -- Busca exata pelos titulos alternativos (case-insensitive)
        OR LOWER(m.primary_title) = ANY(SELECT LOWER(unnest($2::text[])))
        OR LOWER(mn.name) = ANY(SELECT LOWER(unnest($2::text[])))
      )
    ) AS matches
    ORDER BY last_chapter_read DESC NULLS LAST, created_at ASC
    LIMIT 1
  `;

  const result = await pool.query(query, [title, alternativeTitles]);

  if (result.rows.length > 0) {
    return result.rows[0].id;
  }

  return null;
}

// ============================================================================
// CRIAÇÃO/ATUALIZAÇÃO DE MANGA
// ============================================================================

/**
 * Cria um novo manga no banco de dados
 */
async function createManga(pool, data, dryRun = false) {
  const imageUrl = extractImageUrl(data.cover);

  // Obter ou criar FKs das lookup tables
  const statusId = await getOrCreateLookup(pool, 'status', data.publicationStatus, CACHE.status, dryRun);
  const typeId = await getOrCreateLookup(pool, 'types', data.contentType, CACHE.types, dryRun);
  const ratingId = await getOrCreateLookup(pool, 'ratings', data.contentRating, CACHE.ratings, dryRun);

  const query = `
    INSERT INTO mangas (
      primary_title,
      synopsis,
      rating,
      total_chapters,
      image_url,
      status_id,
      type_id,
      rating_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id
  `;

  const params = [
    data.title,
    data.description || null,
    parseScore(data.score),
    data.chaptersCount || null,
    imageUrl,
    statusId,
    typeId,
    ratingId
  ];

  if (dryRun) {
    log('debug', `[DRY-RUN] CREATE manga: ${data.title}`);
    return 'dry-run-id';
  }

  const result = await pool.query(query, params);
  return result.rows[0].id;
}

/**
 * Atualiza um manga existente no banco de dados
 * Aplica regras de atualização da seção 6 do annotations.md
 */
async function updateManga(pool, mangaId, data, dryRun = false) {
  // Primeiro, buscar dados atuais para aplicar regras de atualização
  const currentResult = await pool.query(
    'SELECT synopsis, rating, total_chapters, image_url FROM mangas WHERE id = $1',
    [mangaId]
  );

  if (currentResult.rows.length === 0) {
    throw new Error(`Manga ${mangaId} não encontrado para atualização`);
  }

  const current = currentResult.rows[0];
  const updates = [];
  const params = [];
  let paramIndex = 1;

  // synopsis: Atualizar se atual for NULL ou novo for mais longo
  if (data.description) {
    if (!current.synopsis || data.description.length > current.synopsis.length) {
      updates.push(`synopsis = $${paramIndex++}`);
      params.push(data.description);
    }
  }

  // rating: Atualizar sempre (se for um valor válido)
  const parsedScore = parseScore(data.score);
  if (parsedScore !== null) {
    updates.push(`rating = $${paramIndex++}`);
    params.push(parsedScore);
  }

  // total_chapters: Atualizar se novo > atual
  if (data.chaptersCount && (!current.total_chapters || data.chaptersCount > current.total_chapters)) {
    updates.push(`total_chapters = $${paramIndex++}`);
    params.push(data.chaptersCount);
  }

  // image_url: Atualizar se atual for NULL
  if (!current.image_url) {
    const imageUrl = extractImageUrl(data.cover);
    if (imageUrl) {
      updates.push(`image_url = $${paramIndex++}`);
      params.push(imageUrl);
    }
  }

  // status_id: Atualizar sempre (obter ou criar se não existir)
  if (data.publicationStatus) {
    const statusId = await getOrCreateLookup(pool, 'status', data.publicationStatus, CACHE.status, dryRun);
    if (statusId) {
      updates.push(`status_id = $${paramIndex++}`);
      params.push(statusId);
    }
  }

  // type_id: Atualizar sempre (obter ou criar se não existir)
  if (data.contentType) {
    const typeId = await getOrCreateLookup(pool, 'types', data.contentType, CACHE.types, dryRun);
    if (typeId) {
      updates.push(`type_id = $${paramIndex++}`);
      params.push(typeId);
    }
  }

  // rating_id: Atualizar sempre (obter ou criar se não existir)
  if (data.contentRating) {
    const ratingId = await getOrCreateLookup(pool, 'ratings', data.contentRating, CACHE.ratings, dryRun);
    if (ratingId) {
      updates.push(`rating_id = $${paramIndex++}`);
      params.push(ratingId);
    }
  }

  // updated_at
  updates.push(`updated_at = CURRENT_TIMESTAMP`);

  if (updates.length === 1) {
    // Apenas updated_at, nada mais para atualizar
    log('debug', `  Nenhuma atualização necessária para ${data.title}`);
    return;
  }

  const query = `
    UPDATE mangas
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
  `;
  params.push(mangaId);

  if (dryRun) {
    log('debug', `[DRY-RUN] UPDATE manga: ${data.title}`, { updates });
    return;
  }

  await pool.query(query, params);
}

// ============================================================================
// RELACIONAMENTOS
// ============================================================================

/**
 * Adiciona nomes alternativos ao manga
 */
async function addAlternativeNames(pool, mangaId, data, dryRun = false) {
  const names = [];

  // alternativeTitles
  if (data.alternativeTitles && Array.isArray(data.alternativeTitles)) {
    data.alternativeTitles.forEach(name => {
      names.push({ name, language: 'unknown', isOfficial: false });
    });
  }

  // titleEN
  if (data.titleEN && data.titleEN !== data.title) {
    names.push({ name: data.titleEN, language: 'en', isOfficial: true });
  }

  // titleENJP
  if (data.titleENJP && data.titleENJP !== data.title && data.titleENJP !== data.titleEN) {
    names.push({ name: data.titleENJP, language: 'ja-romaji', isOfficial: true });
  }

  if (names.length === 0) return;

  if (dryRun) {
    log('debug', `[DRY-RUN] ADD ${names.length} alternative names`);
    return;
  }

  for (const item of names) {
    try {
      await pool.query(
        `INSERT INTO manga_names (manga_id, name, language, is_official)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (manga_id, name) DO NOTHING`,
        [mangaId, item.name, item.language, item.isOfficial]
      );
    } catch (err) {
      log('warning', `  Erro ao adicionar nome alternativo: ${item.name}`, err.message);
    }
  }
}

/**
 * Adiciona relacionamentos de classifications (genres, themes, characters, warnings)
 */
async function addClassifications(pool, mangaId, classifications, dryRun = false) {
  if (!classifications || !Array.isArray(classifications)) return;

  const categoryMap = {
    genre: { table: 'manga_genres', fk: 'genre_id', cache: CACHE.genres, lookupTable: 'genres' },
    theme: { table: 'manga_themes', fk: 'theme_id', cache: CACHE.themes, lookupTable: 'themes' },
    character: { table: 'manga_characters', fk: 'character_id', cache: CACHE.characters, lookupTable: 'characters' },
    content_warning: { table: 'manga_warnings', fk: 'warning_id', cache: CACHE.warnings, lookupTable: 'warnings' }
  };

  for (const classification of classifications) {
    const mapping = categoryMap[classification.category];
    if (!mapping) continue;

    // Obter ou criar o registro na lookup table
    const lookupId = await getOrCreateLookup(pool, mapping.lookupTable, classification.name, mapping.cache, dryRun);
    if (!lookupId) {
      continue;
    }

    if (dryRun) {
      log('debug', `[DRY-RUN] ADD ${classification.category}: ${classification.name}`);
      continue;
    }

    try {
      await pool.query(
        `INSERT INTO ${mapping.table} (manga_id, ${mapping.fk})
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [mangaId, lookupId]
      );
    } catch (err) {
      log('warning', `  Erro ao adicionar ${classification.category}: ${classification.name}`, err.message);
    }
  }
}

/**
 * Adiciona links de fontes (mangaSources -> manga_links)
 */
async function addMangaLinks(pool, mangaId, mangaSources, dryRun = false) {
  if (!mangaSources || !Array.isArray(mangaSources)) return;

  let isFirst = true;

  for (const source of mangaSources) {
    if (!source.seriesURL) continue;

    // Obter ou criar o site (se não existir no cache)
    const siteId = await getOrCreateSite(pool, source.name, source.seriesURL, dryRun);
    const isActive = source.siteActive !== false && source.deprecated !== true;

    if (dryRun) {
      log('debug', `[DRY-RUN] ADD link: ${source.name} - ${source.seriesURL}`);
      isFirst = false;
      continue;
    }

    try {
      await pool.query(
        `INSERT INTO manga_links (manga_id, site_id, url, is_primary, is_active)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (manga_id, url) DO UPDATE SET is_active = EXCLUDED.is_active`,
        [mangaId, siteId, source.seriesURL, isFirst, isActive]
      );
    } catch (err) {
      log('warning', `  Erro ao adicionar link: ${source.seriesURL}`, err.message);
    }

    isFirst = false;
  }
}

// ============================================================================
// PROCESSAMENTO DE ARQUIVO JSON
// ============================================================================

/**
 * Processa um arquivo JSON individual
 */
async function processFile(pool, filePath, options = {}) {
  const { dryRun = false, skipImages = false } = options;
  const fileName = path.basename(filePath);

  try {
    // 1. Ler JSON
    const content = fs.readFileSync(filePath, 'utf-8');
    const json = JSON.parse(content);
    const data = json.data;

    // Validar campos obrigatórios
    if (!data || !data.title) {
      log('error', `Arquivo inválido (sem título): ${fileName}`);
      STATS.errors++;
      return;
    }

    log('info', `Processando: ${data.title}`);

    // 2. Buscar manga existente
    const existingId = await findExistingManga(
      pool,
      data.title,
      data.alternativeTitles || []
    );

    let mangaId;
    let action;

    if (existingId) {
      // 3. Atualizar manga existente
      mangaId = existingId;
      action = 'updated';
      await updateManga(pool, mangaId, data, dryRun);
      STATS.updated++;
    } else {
      // 4. Criar novo manga
      mangaId = await createManga(pool, data, dryRun);
      action = 'created';
      STATS.created++;
    }

    // 5. Processar relacionamentos
    await addAlternativeNames(pool, mangaId, data, dryRun);
    await addClassifications(pool, mangaId, data.classifications, dryRun);
    await addMangaLinks(pool, mangaId, data.mangaSources, dryRun);

    log('success', `  ${action === 'created' ? 'Criado' : 'Atualizado'}: ${data.title} (${mangaId})`);

    // 6. Processar imagem ao final do cadastro do manga (se não foi pulado e não for dry-run)
    if (!skipImages && !dryRun && data.cover) {
      await processImage(pool, mangaId, data.cover, dryRun);
    } else if (!skipImages && dryRun && data.cover) {
      log('debug', `[DRY-RUN] DOWNLOAD image: ${extractImageUrl(data.cover)}`);
    }
    STATS.processed++;

  } catch (err) {
    log('error', `Erro ao processar ${fileName}: ${err.message}`);
    STATS.errors++;
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('='.repeat(70));
  console.log('IMPORTADOR KENMEI -> MANGA DB');
  console.log('='.repeat(70));
  console.log('');

  const args = parseArgs();

  if (args.dryRun) {
    log('warning', 'MODO DRY-RUN: Nenhuma alteração será feita no banco');
  }

  // Carregar checkpoint (se existir e não for reset)
  let checkpoint = { processedFiles: new Set(), stats: {} };
  if (!args.reset && !args.dryRun) {
    checkpoint = loadCheckpoint();
    // Restaurar estatísticas do checkpoint
    if (checkpoint.stats.processed) {
      STATS.processed = checkpoint.stats.processed;
      STATS.created = checkpoint.stats.created;
      STATS.updated = checkpoint.stats.updated;
      STATS.errors = checkpoint.stats.errors;
      STATS.imagesDownloaded = checkpoint.stats.imagesDownloaded || 0;
      STATS.imagesSkipped = checkpoint.stats.imagesSkipped || 0;
      STATS.imagesFailed = checkpoint.stats.imagesFailed || 0;
    }
  } else if (args.reset) {
    clearCheckpoint();
    log('info', 'Iniciando do zero (--reset)');
  }

  STATS.startTime = new Date();

  // Conectar ao banco de dados
  const pool = new Pool(CONFIG.db);
  let allCompleted = false;

  try {
    // Testar conexão
    await pool.query('SELECT 1');
    log('success', 'Conectado ao banco de dados');

    // Carregar cache
    await loadCache(pool);

    // Listar arquivos
    let files;
    if (args.file) {
      const filePath = path.join(CONFIG.dataDir, args.file);
      if (!fs.existsSync(filePath)) {
        log('error', `Arquivo não encontrado: ${args.file}`);
        process.exit(1);
      }
      files = [args.file];
    } else {
      files = fs.readdirSync(CONFIG.dataDir).filter(f => f.endsWith('.json'));
    }

    if (args.limit) {
      files = files.slice(0, args.limit);
    }

    // Filtrar arquivos já processados (do checkpoint)
    const pendingFiles = files.filter(f => !checkpoint.processedFiles.has(f));
    const skippedCount = files.length - pendingFiles.length;

    log('info', `Arquivos totais: ${files.length}`);
    if (skippedCount > 0) {
      log('info', `Arquivos já processados (checkpoint): ${skippedCount}`);
    }
    log('info', `Arquivos pendentes: ${pendingFiles.length}`);
    if (args.skipImages) {
      log('info', 'Download de imagens desativado');
    }
    console.log('');

    // Processar cada arquivo (cadastro + imagem ao final de cada manga)
    for (const file of pendingFiles) {
      const filePath = path.join(CONFIG.dataDir, file);
      await processFile(pool, filePath, { dryRun: args.dryRun, skipImages: args.skipImages });

      // Salvar checkpoint após cada manga (se não for dry-run)
      if (!args.dryRun) {
        checkpoint.processedFiles.add(file);
        saveCheckpoint(checkpoint.processedFiles, STATS);
      }
    }

    allCompleted = true;

  } catch (err) {
    log('error', `Erro fatal: ${err.message}`);
    console.error(err);
  } finally {
    await pool.end();
  }

  STATS.endTime = new Date();
  const duration = (STATS.endTime - STATS.startTime) / 1000;

  // Limpar checkpoint se completou tudo com sucesso
  if (allCompleted && !args.dryRun) {
    clearCheckpoint();
  }

  // Resumo final
  console.log('');
  console.log('='.repeat(70));
  console.log('RESUMO');
  console.log('='.repeat(70));
  console.log(`  Processados:        ${STATS.processed}`);
  console.log(`  Criados:            ${STATS.created}`);
  console.log(`  Atualizados:        ${STATS.updated}`);
  console.log(`  Erros:              ${STATS.errors}`);
  console.log(`  Imagens baixadas:   ${STATS.imagesDownloaded}`);
  console.log(`  Imagens existentes: ${STATS.imagesSkipped}`);
  console.log(`  Imagens com erro:   ${STATS.imagesFailed}`);
  console.log(`  Duração:            ${duration.toFixed(2)}s`);
  if (!allCompleted) {
    console.log('');
    console.log('  ⚠️  Importação incompleta - execute novamente para continuar');
  }
  console.log('='.repeat(70));
}

// Executar
main().catch(console.error);
