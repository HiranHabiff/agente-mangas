import axios from 'axios';
import * as cheerio from 'cheerio';

async function debug() {
  const response = await axios.get('https://lermangas.me/manga/a-dama-bebe-controla-o-mundo-com-dinheiro/', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });

  const $ = cheerio.load(response.data);

  console.log('=== Tentando diferentes seletores ===\n');

  const selectors = [
    '.description-summary',
    '.summary__content',
    '.manga-excerpt',
    '.entry-content',
    '.post-content',
    'div.summary__content p',
    '.tab-summary',
    '.summary_content',
  ];

  for (const sel of selectors) {
    const el = $(sel);
    if (el.length) {
      const text = el.first().text().trim().substring(0, 100);
      console.log(`${sel}: ENCONTRADO (${el.length} elementos)`);
      console.log(`  Texto: ${text || '(vazio)'}...\n`);
    }
  }

  // Procurar por texto específico
  console.log('=== Procurando texto da sinopse ===');
  const html = response.data;
  if (html.includes('Vivi sofrendo')) {
    console.log('Texto "Vivi sofrendo" EXISTE no HTML!');

    // Encontrar contexto
    const idx = html.indexOf('Vivi sofrendo');
    console.log('\nContexto HTML:');
    console.log(html.substring(idx - 200, idx + 300));
  } else {
    console.log('Texto NÃO encontrado - pode estar carregado via JS');
  }
}

debug();
