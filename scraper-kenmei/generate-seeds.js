/**
 * Script para extrair dados dos arquivos JSON e gerar seeds SQL
 *
 * Lê todos os arquivos *.json em data-items/ e gera arquivos .sql
 * com INSERTs para popular as tabelas de lookup.
 *
 * Uso: node generate-seeds.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Diretórios
const DATA_DIR = path.join(__dirname, 'data-items');
const SEEDS_DIR = path.join(__dirname, 'seeds');

// Cores predefinidas para cada tabela
const COLORS = {
  status: {
    'Finished': '#28a745',
    'Releasing': '#007bff',
    'Cancelled': '#dc3545',
    'On Hiatus': '#ffc107'
  },
  types: {
    'Manga': '#e74c3c',
    'Manhwa': '#3498db',
    'Manhua': '#2ecc71'
  },
  ratings: {
    'Safe': '#28a745',
    'Suggestive': '#fd7e14',
    'Erotica': '#fd7e14',
    'Pornographic': '#dc3545'
  },
  characters: {
    'Male Protagonist': '#3498db',
    'Female Protagonist': '#e91e63'
  },
  warnings: {
    'Gore': '#dc3545',
    'Suicide': '#6c757d',
    'Torture': '#dc3545'
  },
  demographic: {
    'Seinen': '#6c757d',
    'Shounen': '#ff6b6b',
    'Shoujo': '#ff69b4',
    'Josei': '#9b59b6'
  },
  genres: {
    'Action': '#e74c3c',
    'Adventure': '#f39c12',
    'Comedy': '#f1c40f',
    'Drama': '#9b59b6',
    'Fantasy': '#8e44ad',
    'Horror': '#2c3e50',
    'Mystery': '#34495e',
    'Psychological': '#7f8c8d',
    'Romance': '#e91e63',
    'Sci-Fi': '#00bcd4',
    'Slice of Life': '#4caf50',
    'Sports': '#ff5722'
  },
  themes: {
    "Boys' Love": '#e91e63',
    'Crossdressing': '#9c27b0',
    'Delinquents': '#ff5722',
    "Girls' Love": '#e91e63',
    'Harem': '#f44336',
    'Historical': '#795548',
    'Martial Arts': '#ff9800',
    'Mecha': '#607d8b',
    'Military': '#4caf50',
    'Music': '#00bcd4',
    'Regression': '#673ab7',
    'Reincarnation': '#3f51b5',
    'Reverse Harem': '#f44336',
    'Samurai': '#795548',
    'School': '#2196f3',
    'Survival': '#ff5722',
    'Vampire': '#9c27b0',
    'Villainess': '#e91e63'
  }
};

// Descrições predefinidas
const DESCRIPTIONS = {
  status: {
    'Finished': 'Obra finalizada/completa',
    'Releasing': 'Em publicação ativa',
    'Cancelled': 'Publicação cancelada',
    'On Hiatus': 'Publicação em hiato/pausa'
  },
  types: {
    'Manga': 'Quadrinhos japoneses (Japão)',
    'Manhwa': 'Quadrinhos coreanos (Coreia do Sul)',
    'Manhua': 'Quadrinhos chineses (China)'
  },
  ratings: {
    'Safe': 'Conteúdo seguro para todas as idades',
    'Suggestive': 'Conteúdo sugestivo',
    'Erotica': 'Conteúdo erótico (18+)',
    'Pornographic': 'Conteúdo pornográfico explícito (18+)'
  },
  characters: {
    'Male Protagonist': 'Protagonista masculino',
    'Female Protagonist': 'Protagonista feminino'
  },
  warnings: {
    'Gore': 'Contém cenas de violência gráfica/gore',
    'Suicide': 'Contém temas relacionados a suicídio',
    'Torture': 'Contém cenas de tortura'
  },
  demographic: {
    'Seinen': 'Público-alvo: homens adultos (18+)',
    'Shounen': 'Público-alvo: meninos adolescentes',
    'Shoujo': 'Público-alvo: meninas adolescentes',
    'Josei': 'Público-alvo: mulheres adultas (18+)'
  },
  genres: {
    'Action': 'Gênero de ação com combates e confrontos',
    'Adventure': 'Gênero de aventura com explorações e jornadas',
    'Comedy': 'Gênero de comédia com humor',
    'Drama': 'Gênero dramático com conflitos emocionais',
    'Fantasy': 'Gênero de fantasia com elementos mágicos',
    'Horror': 'Gênero de horror e terror',
    'Mystery': 'Gênero de mistério com investigações',
    'Psychological': 'Gênero psicológico com foco na mente',
    'Romance': 'Gênero romântico com relacionamentos amorosos',
    'Sci-Fi': 'Gênero de ficção científica',
    'Slice of Life': 'Gênero cotidiano/fatia de vida',
    'Sports': 'Gênero esportivo'
  },
  themes: {
    "Boys' Love": 'Tema de romance entre homens (BL/Yaoi)',
    'Crossdressing': 'Tema com personagens usando roupas do gênero oposto',
    'Delinquents': 'Tema com delinquentes juvenis',
    "Girls' Love": 'Tema de romance entre mulheres (GL/Yuri)',
    'Harem': 'Tema com múltiplos interesses românticos',
    'Historical': 'Tema histórico/de época',
    'Martial Arts': 'Tema de artes marciais',
    'Mecha': 'Tema com robôs gigantes',
    'Military': 'Tema militar',
    'Music': 'Tema musical',
    'Regression': 'Tema de regressão temporal',
    'Reincarnation': 'Tema de reencarnação',
    'Reverse Harem': 'Tema com múltiplos interesses românticos masculinos',
    'Samurai': 'Tema de samurais',
    'School': 'Tema escolar/colegial',
    'Survival': 'Tema de sobrevivência',
    'Vampire': 'Tema com vampiros',
    'Villainess': 'Tema com protagonista vilã'
  }
};

// Dados coletados
const collectedData = {
  status: new Set(),
  types: new Set(),
  ratings: new Set(),
  characters: new Set(),
  warnings: new Set(),
  genres: new Set(),
  themes: new Set(),
  sites: new Map()
};

/**
 * Lê todos os arquivos JSON e extrai os dados
 */
function collectData() {
  console.log('Lendo arquivos JSON...');

  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  console.log(`Encontrados ${files.length} arquivos JSON`);

  let processed = 0;
  let errors = 0;

  files.forEach(file => {
    try {
      const filePath = path.join(DATA_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const json = JSON.parse(content);
      const data = json.data;

      // publicationStatus -> status
      if (data.publicationStatus) {
        collectedData.status.add(data.publicationStatus);
      }

      // contentType -> types
      if (data.contentType) {
        collectedData.types.add(data.contentType);
      }

      // contentRating -> ratings
      if (data.contentRating) {
        collectedData.ratings.add(data.contentRating);
      }

      // classifications
      if (data.classifications && Array.isArray(data.classifications)) {
        data.classifications.forEach(c => {
          if (c.category === 'character') {
            collectedData.characters.add(c.name);
          }
          if (c.category === 'content_warning') {
            collectedData.warnings.add(c.name);
          }
          if (c.category === 'genre') {
            collectedData.genres.add(c.name);
          }
          if (c.category === 'theme') {
            collectedData.themes.add(c.name);
          }
        });
      }

      // mangaSources -> sites
      if (data.mangaSources && Array.isArray(data.mangaSources)) {
        data.mangaSources.forEach(source => {
          if (source.name && !collectedData.sites.has(source.name)) {
            // Extrair URL base do site
            let baseUrl = '';
            if (source.seriesURL) {
              try {
                const url = new URL(source.seriesURL);
                baseUrl = `${url.protocol}//${url.host}`;
              } catch (e) {
                baseUrl = source.seriesURL.split('/').slice(0, 3).join('/');
              }
            }

            collectedData.sites.set(source.name, {
              name: source.name,
              url: baseUrl,
              siteActive: source.siteActive !== false,
              language: 'en' // Default
            });
          }
        });
      }

      processed++;
    } catch (e) {
      errors++;
    }
  });

  console.log(`Processados: ${processed}, Erros: ${errors}`);
}

/**
 * Escapa string para SQL
 */
function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return str.replace(/'/g, "''");
}

/**
 * Gera arquivo SQL para tabela simples (status, types, ratings, characters, warnings, demographic)
 */
function generateSimpleSeed(tableName, values, hasColor = true) {
  const valuesArray = Array.isArray(values) ? values : [...values];

  let sql = `-- ============================================================================\n`;
  sql += `-- Seed: ${tableName}\n`;
  sql += `-- Gerado automaticamente por generate-seeds.js\n`;
  sql += `-- Data: ${new Date().toISOString()}\n`;
  sql += `-- ============================================================================\n\n`;

  if (valuesArray.length === 0) {
    sql += `-- Nenhum dado encontrado para esta tabela\n`;
    return sql;
  }

  const columns = hasColor
    ? `("name", "color", "description")`
    : `("name", "description")`;

  sql += `INSERT INTO "${tableName}" ${columns} VALUES\n`;

  const rows = valuesArray.map((name, index) => {
    const color = COLORS[tableName]?.[name] || '#6c757d';
    const description = DESCRIPTIONS[tableName]?.[name] || name;
    const comma = index < valuesArray.length - 1 ? ',' : '';

    if (hasColor) {
      return `  ('${escapeSql(name)}', '${color}', '${escapeSql(description)}')${comma}`;
    } else {
      return `  ('${escapeSql(name)}', '${escapeSql(description)}')${comma}`;
    }
  });

  sql += rows.join('\n');
  sql += `\nON CONFLICT ("name") DO NOTHING;\n`;

  return sql;
}

/**
 * Gera arquivo SQL para tabela sites
 */
function generateSitesSeed() {
  const sites = [...collectedData.sites.values()].sort((a, b) => a.name.localeCompare(b.name));

  let sql = `-- ============================================================================\n`;
  sql += `-- Seed: sites\n`;
  sql += `-- Gerado automaticamente por generate-seeds.js\n`;
  sql += `-- Data: ${new Date().toISOString()}\n`;
  sql += `-- ============================================================================\n\n`;

  if (sites.length === 0) {
    sql += `-- Nenhum site encontrado\n`;
    return sql;
  }

  sql += `INSERT INTO "sites" ("name", "url", "image", "language", "active", "description") VALUES\n`;

  const rows = sites.map((site, index) => {
    const comma = index < sites.length - 1 ? ',' : '';
    const image = `/images/sites/${site.name.toLowerCase().replace(/\s+/g, '-')}.png`;
    const description = `Agregador de mangás: ${site.name}`;

    return `  ('${escapeSql(site.name)}', '${escapeSql(site.url)}', '${escapeSql(image)}', '${site.language}', ${site.siteActive}, '${escapeSql(description)}')${comma}`;
  });

  sql += rows.join('\n');
  sql += `\nON CONFLICT ("name") DO NOTHING;\n`;

  return sql;
}

/**
 * Salva arquivo SQL
 */
function saveSeed(filename, content) {
  const filePath = path.join(SEEDS_DIR, filename);
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`  Gerado: ${filename}`);
}

/**
 * Função principal
 */
function main() {
  console.log('='.repeat(60));
  console.log('Gerador de Seeds SQL - Kenmei Scraper');
  console.log('='.repeat(60));
  console.log('');

  // Verificar se diretório de seeds existe
  if (!fs.existsSync(SEEDS_DIR)) {
    fs.mkdirSync(SEEDS_DIR, { recursive: true });
  }

  // Coletar dados dos JSONs
  collectData();

  console.log('');
  console.log('Dados coletados:');
  console.log(`  - Status: ${collectedData.status.size} valores`);
  console.log(`  - Types: ${collectedData.types.size} valores`);
  console.log(`  - Ratings: ${collectedData.ratings.size} valores`);
  console.log(`  - Characters: ${collectedData.characters.size} valores`);
  console.log(`  - Warnings: ${collectedData.warnings.size} valores`);
  console.log(`  - Genres: ${collectedData.genres.size} valores`);
  console.log(`  - Themes: ${collectedData.themes.size} valores`);
  console.log(`  - Sites: ${collectedData.sites.size} valores`);

  console.log('');
  console.log('Gerando arquivos SQL...');

  // Gerar seeds
  saveSeed('status.sql', generateSimpleSeed('status', collectedData.status));
  saveSeed('types.sql', generateSimpleSeed('types', collectedData.types));
  saveSeed('ratings.sql', generateSimpleSeed('ratings', collectedData.ratings));
  saveSeed('characters.sql', generateSimpleSeed('characters', collectedData.characters));
  saveSeed('warnings.sql', generateSimpleSeed('warnings', collectedData.warnings));

  // Demographic com valores padrão (não existe nos dados do Kenmei)
  saveSeed('demographic.sql', generateSimpleSeed('demographic', ['Seinen', 'Shounen', 'Shoujo', 'Josei']));

  // Genres e Themes (extraídos de classifications)
  saveSeed('genres.sql', generateSimpleSeed('genres', collectedData.genres));
  saveSeed('themes.sql', generateSimpleSeed('themes', collectedData.themes));

  // Sites
  saveSeed('sites.sql', generateSitesSeed());

  console.log('');
  console.log('Concluído!');
  console.log('='.repeat(60));
}

// Executar
main();
