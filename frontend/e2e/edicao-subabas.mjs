import puppeteer from 'puppeteer-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const API = 'http://localhost:3011/api';
const BASE = process.argv[2];
const LABEL = process.argv[3] || BASE;
const TAG = `ZZE2E-${Date.now().toString(36)}`;

const results = [];
const consoleErrors = [];
const netErrors = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const api = async (path, init) => {
  const r = await fetch(`${API}${path}`, init);
  if (!r.ok) throw new Error(`API ${r.status} em ${path}`);
  return r.status === 204 ? null : r.json();
};

let idx = 0;
async function step(name, fn) {
  idx++;
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`  PASS  ${name}`);
  } catch (err) {
    results.push({ name, ok: false, error: err.message });
    console.log(`  FAIL  ${name}\n        ${err.message}`);
    try {
      await page.screenshot({ path: `fail3-${LABEL}-${idx}.png` });
      const txt = await page.evaluate(() => document.body.innerText.slice(0, 400));
      console.log(`        [diag] ${page.url()} :: ${txt.replace(/\n+/g, ' | ').slice(0, 300)}`);
    } catch {}
  }
}

async function clickByText(page, selector, text, { exact = true, scope = null } = {}) {
  const root = scope || page;
  for (const h of await root.$$(selector)) {
    const t = (await h.evaluate((el) => (el.textContent || '').trim())).replace(/\s+/g, ' ');
    const vis = await h.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
    if (!vis) continue;
    if (exact ? t === text : t.includes(text)) {
      await h.evaluate((el) => el.scrollIntoView({ block: 'center' }));
      await h.click();
      return;
    }
  }
  throw new Error(`nao achei ${selector} visivel com texto "${text}"`);
}

const waitText = (page, t, timeout = 45000) =>
  page.waitForFunction((x) => document.body.innerText.includes(x), { timeout }, t);

async function setInput(page, selector, value) {
  const el = await page.waitForSelector(selector, { visible: true, timeout: 45000 });
  await el.click({ clickCount: 3 });
  await page.keyboard.press('Backspace');
  await el.type(value, { delay: 8 });
}

/** Clica em "Save Changes" e espera voltar para a tela de detalhe. */
async function save(page, detailPath) {
  await clickByText(page, 'button', 'Save Changes', { exact: false });
  await page.waitForFunction((p) => location.pathname === p, { timeout: 45000 }, detailPath);
  await sleep(800);
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--window-size=1440,1100'],
  defaultViewport: { width: 1440, height: 1100 },
});
const page = await browser.newPage();
page.on('console', (m) => {
  if (m.type() === 'error' && !/favicon|ERR_/.test(m.text())) consoleErrors.push(m.text().slice(0, 200));
});
page.on('pageerror', (e) => consoleErrors.push(`[pageerror] ${e.message}`.slice(0, 200)));
page.on('response', (r) => {
  if (r.status() >= 400 && !/favicon/.test(r.url()))
    netErrors.push(`${r.status()} ${r.request().method()} ${r.url().slice(0, 120)}`);
});

console.log(`\n=== ${LABEL} rodada 3 — sub-abas de edicao (${BASE}) — prefixo: ${TAG} ===\n`);

let mid = null;
let detailPath = null;

await step('preparo: criar manga', async () => {
  const m = await api('/mangas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ primaryTitle: `${TAG}-manga` }),
  });
  mid = m.id;
  detailPath = `/mangas/${mid}`;
});

await step('edit/Basic: rating, totalChapters e synopsis', async () => {
  await page.goto(`${BASE}${detailPath}/edit`, { waitUntil: 'networkidle2', timeout: 90000 });
  await page.waitForSelector('input#rating', { visible: true, timeout: 45000 });
  await setInput(page, 'input#rating', '8.5');
  await setInput(page, 'input#totalChapters', '42');
  await setInput(page, 'textarea#synopsis, input#synopsis', 'Sinopse de teste E2E');
  await save(page, detailPath);
  const m = await api(`/mangas/${mid}`);
  const rating = m.rating ?? m.Rating;
  const total = m.totalChapters ?? m.total_chapters;
  const syn = m.synopsis;
  if (Number(rating) !== 8.5) throw new Error(`rating=${rating}, esperado 8.5`);
  if (Number(total) !== 42) throw new Error(`totalChapters=${total}, esperado 42`);
  if (!String(syn).includes('Sinopse de teste E2E')) throw new Error(`synopsis="${syn}"`);
});

await step('edit/Tags: selecionar um genero no multi-select', async () => {
  await page.goto(`${BASE}${detailPath}/edit`, { waitUntil: 'networkidle2', timeout: 90000 });
  await page.waitForSelector('input#primaryTitle', { visible: true, timeout: 45000 });
  await clickByText(page, 'button[role="tab"]', 'Tags', { exact: true });
  await sleep(500);
  const genres = await api('/admin/genres');
  const alvo = genres[0];
  if (!alvo) throw new Error('nao ha generos cadastrados para testar');
  await setInput(page, 'input[placeholder="Search genres..."]', alvo.name);
  await sleep(400);
  await clickByText(page, 'button[type="button"]', alvo.name, { exact: false });
  await save(page, detailPath);
  const m = await api(`/mangas/${mid}`);
  const gs = (m.genres || []).map((g) => g.name);
  if (!gs.includes(alvo.name)) throw new Error(`generos na API: [${gs.join(', ')}], esperava "${alvo.name}"`);
});

await step('edit/Names: adicionar nome alternativo', async () => {
  await page.goto(`${BASE}${detailPath}/edit`, { waitUntil: 'networkidle2', timeout: 90000 });
  await page.waitForSelector('input#primaryTitle', { visible: true, timeout: 45000 });
  await clickByText(page, 'button[role="tab"]', 'Names', { exact: true });
  await sleep(400);
  await setInput(page, 'input[placeholder="Add alternative title..."]', `${TAG}-alt`);
  await page.keyboard.press('Enter');
  await waitText(page, `${TAG}-alt`);
  await save(page, detailPath);
  const m = await api(`/mangas/${mid}`);
  const names = (m.alternativeNames ?? m.alternative_names ?? []).map((n) => n.name ?? n);
  if (!names.includes(`${TAG}-alt`)) throw new Error(`nomes na API: [${names.join(', ')}]`);
});

await step('edit/Links: adicionar link externo', async () => {
  await page.goto(`${BASE}${detailPath}/edit`, { waitUntil: 'networkidle2', timeout: 90000 });
  await page.waitForSelector('input#primaryTitle', { visible: true, timeout: 45000 });
  await clickByText(page, 'button[role="tab"]', 'Links', { exact: true });
  await sleep(400);
  await setInput(page, 'input[placeholder="https://mangadex.org/title/..."]', 'https://exemplo-e2e.test/obra/1');
  await page.keyboard.press('Enter');
  await waitText(page, 'exemplo-e2e.test');
  await save(page, detailPath);
  const m = await api(`/mangas/${mid}`);
  const urls = (m.links || []).map((l) => l.url);
  if (!urls.some((u) => u.includes('exemplo-e2e.test'))) throw new Error(`links na API: [${urls.join(', ')}]`);
});

await step('detalhe: aba Names mostra o nome alternativo salvo', async () => {
  await page.goto(`${BASE}${detailPath}`, { waitUntil: 'networkidle2', timeout: 90000 });
  await waitText(page, `${TAG}-manga`);
  await clickByText(page, 'button[role="tab"]', 'Names', { exact: false });
  await waitText(page, `${TAG}-alt`);
});

await browser.close();

try {
  await fetch(`${API}/mangas/${mid}`, { method: 'DELETE' });
  console.log(`\nlimpeza: manga ${TAG}-manga removido`);
} catch (e) {
  console.log(`\naviso: falha ao limpar o manga de teste: ${e.message}`);
}

const pass = results.filter((r) => r.ok).length;
console.log(`\n--- ${LABEL} rodada 3: ${pass}/${results.length} passaram ---`);
results.filter((r) => !r.ok).forEach((r) => console.log(`  * ${r.name}: ${r.error}`));
if (consoleErrors.length) {
  console.log(`\nERROS DE CONSOLE (${consoleErrors.length}):`);
  [...new Set(consoleErrors)].slice(0, 8).forEach((e) => console.log(`  ! ${e}`));
}
if (netErrors.length) {
  console.log(`\nHTTP >=400 (${netErrors.length}):`);
  [...new Set(netErrors)].slice(0, 8).forEach((e) => console.log(`  ! ${e}`));
}
console.log('');
process.exit(results.length - pass ? 1 : 0);
