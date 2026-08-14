import puppeteer from 'puppeteer-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = process.argv[2];
const LABEL = process.argv[3] || BASE;
const TAG = `ZZE2E-${Date.now().toString(36)}`;

if (!BASE) {
  console.error('uso: node run.mjs <baseUrl> [label]');
  process.exit(2);
}

const results = [];
const consoleErrors = [];
const netErrors = [];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const API = 'http://localhost:3011/api';
const api = async (path, init) => {
  const r = await fetch(`${API}${path}`, init);
  if (!r.ok) throw new Error(`API ${r.status} em ${path}`);
  return r.status === 204 ? null : r.json();
};

let stepIndex = 0;
async function step(name, fn) {
  const t0 = Date.now();
  stepIndex++;
  try {
    await fn();
    results.push({ name, ok: true, ms: Date.now() - t0 });
    console.log(`  PASS  ${name}`);
  } catch (err) {
    results.push({ name, ok: false, ms: Date.now() - t0, error: err.message });
    console.log(`  FAIL  ${name}\n        ${err.message}`);
    try {
      const file = `fail-${LABEL}-${stepIndex}.png`;
      await page.screenshot({ path: file });
      const txt = await page.evaluate(() => document.body.innerText.slice(0, 600));
      console.log(`        [diag] url=${page.url()}`);
      console.log(`        [diag] screenshot=${file}`);
      console.log(`        [diag] tela: ${txt.replace(/\n+/g, ' | ').slice(0, 400)}`);
    } catch {}
  }
}

// --- helpers de DOM -------------------------------------------------------

async function visibleHandles(page, selector) {
  const all = await page.$$(selector);
  const out = [];
  for (const h of all) {
    const vis = await h.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
    });
    if (vis) out.push(h);
    else await h.dispose();
  }
  return out;
}

async function clickByText(page, selector, text, { exact = true, scope = null } = {}) {
  const root = scope || page;
  const all = await root.$$(selector);
  for (const h of all) {
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

async function waitText(page, text, timeout = 45000) {
  await page.waitForFunction(
    (t) => document.body && document.body.innerText.includes(t),
    { timeout },
    text
  );
}

async function waitNoText(page, text, timeout = 45000) {
  await page.waitForFunction(
    (t) => document.body && !document.body.innerText.includes(t),
    { timeout },
    text
  );
}

async function setInput(page, selector, value) {
  const el = await page.waitForSelector(selector, { visible: true, timeout: 45000 });
  await el.click({ clickCount: 3 });
  await page.keyboard.press('Backspace');
  await el.type(value, { delay: 8 });
}

/**
 * Abre o DropdownMenu (Radix) do container que contem `text`.
 * Faz hover antes porque em varios cards o gatilho e opacity-0 ate group-hover.
 */
async function openMenuNear(page, text) {
  const container = await page.evaluateHandle((txt) => {
    const leaf = [...document.querySelectorAll('*')].find(
      (el) => el.children.length === 0 && (el.textContent || '').trim() === txt
    );
    if (!leaf) return null;
    let node = leaf;
    while (node && !node.querySelector?.('button[aria-haspopup="menu"]')) node = node.parentElement;
    return node;
  }, text);
  const cont = container.asElement();
  if (!cont) throw new Error(`nao achei container com menu perto de "${text}"`);
  await cont.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  await cont.hover();
  await sleep(250);
  const trigger = await cont.$('button[aria-haspopup="menu"]');
  if (!trigger) throw new Error(`container de "${text}" sem gatilho de menu`);
  await trigger.hover();
  await trigger.click();
  await page.waitForSelector('[role="menu"]', { visible: true, timeout: 5000 });
}

async function clickMenuItem(page, text) {
  await clickByText(page, '[role="menuitem"]', text);
  await sleep(250);
}

/** Clica um botao dentro do dialog aberto (evita colidir com menus/tabelas). */
async function clickInDialog(page, text) {
  const dialogs = await visibleHandles(page, '[role="dialog"], [role="alertdialog"]');
  if (!dialogs.length) throw new Error('nenhum dialog aberto');
  const dlg = dialogs[dialogs.length - 1];
  await clickByText(page, 'button', text, { scope: dlg });
}

// --- execucao -------------------------------------------------------------

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--window-size=1440,1000'],
  defaultViewport: { width: 1440, height: 1000 },
});

const page = await browser.newPage();

page.on('console', (m) => {
  if (m.type() === 'error') {
    const t = m.text();
    if (/favicon|ERR_/.test(t)) return;
    consoleErrors.push(t.slice(0, 300));
  }
});
page.on('pageerror', (e) => consoleErrors.push(`[pageerror] ${e.message}`.slice(0, 300)));
page.on('response', (r) => {
  if (r.status() >= 400 && !/favicon/.test(r.url())) {
    netErrors.push(`${r.status()} ${r.request().method()} ${r.url().slice(0, 140)}`);
  }
});

console.log(`\n=== ${LABEL} (${BASE}) — prefixo dos dados de teste: ${TAG} ===\n`);

let createdMangaUrl = null;

// ---- 1. CRUD de tabela lookup (/admin/genres) ----
await step('admin/genres: criar item', async () => {
  await page.goto(`${BASE}/admin/genres`, { waitUntil: 'networkidle2', timeout: 90000 });
  await waitText(page, 'English Name');
  // exact:true — senao casa com o "Add Manga" do header
  await clickByText(page, 'button', 'Add', { exact: true });
  await waitText(page, 'Add New Item');
  await setInput(page, 'input#name', `${TAG}-genero`);
  await clickInDialog(page, 'Create');
  await waitNoText(page, 'Add New Item');
  await setInput(page, 'input[placeholder="Search..."]', TAG);
  await waitText(page, `${TAG}-genero`);
  const rows = await api('/admin/genres');
  if (!rows.some((r) => r.name === `${TAG}-genero`)) throw new Error('API nao mostra o genero criado');
});

await step('admin/genres: editar item', async () => {
  await openMenuNear(page, `${TAG}-genero`);
  await clickMenuItem(page, 'Edit');
  await waitText(page, 'Edit Item');
  await setInput(page, 'input#name', `${TAG}-genero-editado`);
  await clickInDialog(page, 'Save');
  await waitNoText(page, 'Edit Item');
  await waitText(page, `${TAG}-genero-editado`);
  const rows = await api('/admin/genres');
  if (!rows.some((r) => r.name === `${TAG}-genero-editado`)) throw new Error('API nao refletiu a edicao');
});

await step('admin/genres: excluir item', async () => {
  await openMenuNear(page, `${TAG}-genero-editado`);
  await clickMenuItem(page, 'Delete');
  await waitText(page, 'Confirm Delete');
  await clickInDialog(page, 'Delete');
  await waitNoText(page, `${TAG}-genero-editado`);
  const rows = await api('/admin/genres');
  if (rows.some((r) => r.name.startsWith(TAG))) throw new Error('API ainda tem o genero de teste');
});

// ---- 2. CRUD de listas (/lists) ----
await step('lists: criar lista', async () => {
  await page.goto(`${BASE}/lists`, { waitUntil: 'networkidle2', timeout: 90000 });
  await waitText(page, 'Reading Lists');
  await clickByText(page, 'button', 'Create List', { exact: false });
  await waitText(page, 'Create New List');
  await setInput(page, 'input#name', `${TAG}-lista`);
  await clickInDialog(page, 'Create');
  await waitText(page, `${TAG}-lista`);
  const ls = await api('/lists');
  if (!ls.some((l) => l.name === `${TAG}-lista`)) throw new Error('API nao mostra a lista criada');
});

await step('lists: renomear lista', async () => {
  await openMenuNear(page, `${TAG}-lista`);
  await clickMenuItem(page, 'Edit');
  await waitText(page, 'Edit List');
  // o dialog de edicao usa id="edit-name" (o de criacao usa id="name")
  await setInput(page, 'input#edit-name', `${TAG}-lista-editada`);
  await clickInDialog(page, 'Save');
  await waitText(page, `${TAG}-lista-editada`);
  const ls = await api('/lists');
  if (!ls.some((l) => l.name === `${TAG}-lista-editada`)) throw new Error('API nao refletiu o rename');
});

await step('lists: persistencia apos reload', async () => {
  await page.reload({ waitUntil: 'networkidle2', timeout: 90000 });
  await waitText(page, `${TAG}-lista-editada`);
});

// ---- 3. Ciclo completo de manga (criar -> editar -> excluir) ----
await step('manga: criar via modal do header', async () => {
  await page.goto(`${BASE}/mangas`, { waitUntil: 'networkidle2', timeout: 90000 });
  await clickByText(page, 'button', 'Add Manga', { exact: false });
  await waitText(page, 'Add New Manga');
  await setInput(page, 'input#primaryTitle', `${TAG}-manga`);
  await clickInDialog(page, 'Create Manga');
  await page.waitForFunction(() => /\/mangas\/[0-9a-f-]{16,}$/.test(location.pathname), {
    timeout: 45000,
  });
  createdMangaUrl = page.url();
  await waitText(page, `${TAG}-manga`);
});

const mangaId = () => createdMangaUrl.split('/').pop();

await step('manga: incrementar capitulo (+)', async () => {
  // o display do capitulo e um <button class="w-40 h-10 ...">; +/- sao os irmaos
  await page.waitForSelector('button.w-40.h-10', { visible: true, timeout: 45000 });
  const before = await page.$eval('button.w-40.h-10', (el) => Number(el.textContent.trim()));
  await page.evaluate(() => {
    const disp = document.querySelector('button.w-40.h-10');
    const btns = [...disp.parentElement.querySelectorAll('button')];
    btns[btns.indexOf(disp) + 1].click();
  });
  await page.waitForFunction(
    (b) => {
      const el = document.querySelector('button.w-40.h-10');
      return el && Number(el.textContent.trim()) === b + 1;
    },
    { timeout: 45000 },
    before
  );
  const m = await api(`/mangas/${mangaId()}`);
  const read = m.last_chapter_read ?? m.lastChapterRead;
  if (Number(read) !== before + 1) throw new Error(`API diz lastChapterRead=${read}, esperado ${before + 1}`);
});

await step('manga: capitulo persiste apos reload', async () => {
  await page.reload({ waitUntil: 'networkidle2', timeout: 90000 });
  await page.waitForSelector('button.w-40.h-10', { visible: true, timeout: 45000 });
  const shown = await page.$eval('button.w-40.h-10', (el) => Number(el.textContent.trim()));
  if (shown !== 1) throw new Error(`apos reload a tela mostra ${shown}, esperado 1`);
});

await step('manga: mudar status para Completed', async () => {
  await clickByText(page, 'button[role="combobox"]', 'Plan to Read', { exact: false });
  await page.waitForSelector('[role="option"]', { visible: true, timeout: 5000 });
  await clickByText(page, '[role="option"]', 'Completed', { exact: false });
  await sleep(1500);
  const m = await api(`/mangas/${mangaId()}`);
  if (m.status !== 'completed') throw new Error(`API diz status="${m.status}", esperado "completed"`);
  await page.reload({ waitUntil: 'networkidle2', timeout: 90000 });
  await page.waitForFunction(
    () => {
      const cb = document.querySelector('button[role="combobox"]');
      return cb && cb.textContent.includes('Completed');
    },
    { timeout: 45000 }
  );
});

await step('manga: editar titulo em /edit', async () => {
  await page.goto(`${createdMangaUrl}/edit`, { waitUntil: 'networkidle2', timeout: 90000 });
  await page.waitForSelector('input#primaryTitle', { visible: true, timeout: 45000 });
  await setInput(page, 'input#primaryTitle', `${TAG}-manga-editado`);
  await clickByText(page, 'button', 'Save Changes', { exact: false });
  await page.waitForFunction(
    (u) => location.pathname === new URL(u).pathname,
    { timeout: 45000 },
    createdMangaUrl
  );
  await waitText(page, `${TAG}-manga-editado`);
  const m = await api(`/mangas/${mangaId()}`);
  const title = m.primary_title ?? m.primaryTitle;
  if (title !== `${TAG}-manga-editado`) throw new Error(`API diz primaryTitle="${title}"`);
});

await step('manga: excluir e voltar para /mangas', async () => {
  await page.goto(`${createdMangaUrl}/edit`, { waitUntil: 'networkidle2', timeout: 90000 });
  await page.waitForSelector('input#primaryTitle', { visible: true, timeout: 45000 });
  await clickByText(page, 'button', 'Delete Manga', { exact: false });
  await waitText(page, 'Delete this manga?');
  await clickInDialog(page, 'Delete');
  await page.waitForFunction(() => location.pathname === '/mangas', { timeout: 45000 });
  const id = mangaId();
  let gone = false;
  try {
    await api(`/mangas/${id}`);
  } catch {
    gone = true;
  }
  if (!gone) throw new Error('API ainda retorna o manga apos o delete');
  createdMangaUrl = null;
});

// ---- 4. limpeza: remover a lista de teste ----
await step('lists: excluir lista de teste (limpeza)', async () => {
  await page.goto(`${BASE}/lists`, { waitUntil: 'networkidle2', timeout: 90000 });
  await waitText(page, `${TAG}-lista-editada`);
  await openMenuNear(page, `${TAG}-lista-editada`);
  await clickMenuItem(page, 'Delete');
  await sleep(500);
  await clickInDialog(page, 'Delete');
  await waitNoText(page, `${TAG}-lista-editada`);
  const ls = await api('/lists');
  if (ls.some((l) => l.name.startsWith(TAG))) throw new Error('API ainda tem a lista de teste');
});

await browser.close();

// --- rede de seguranca: nada de teste pode sobrar no banco --------------
const swept = [];
for (const [path, label] of [['/lists', 'lista'], ['/admin/genres', 'genre']]) {
  try {
    const rows = await api(path);
    for (const r of rows.filter((x) => (x.name || '').startsWith(TAG))) {
      await fetch(`${API}${path}/${r.id}`, { method: 'DELETE' });
      swept.push(`${label}: ${r.name}`);
    }
  } catch {}
}
if (createdMangaUrl) {
  try {
    await fetch(`${API}/mangas/${createdMangaUrl.split('/').pop()}`, { method: 'DELETE' });
    swept.push(`manga: ${createdMangaUrl}`);
  } catch {}
}
if (swept.length) {
  console.log(`\nLIMPEZA DE SEGURANCA (removidos via API porque a UI nao removeu):`);
  swept.forEach((s) => console.log(`  - ${s}`));
}

// --- relatorio ------------------------------------------------------------

const pass = results.filter((r) => r.ok).length;
const fail = results.length - pass;

console.log(`\n--- ${LABEL}: ${pass}/${results.length} passaram ---`);
if (fail) {
  console.log('\nFALHAS:');
  results.filter((r) => !r.ok).forEach((r) => console.log(`  * ${r.name}: ${r.error}`));
}
if (consoleErrors.length) {
  console.log(`\nERROS DE CONSOLE (${consoleErrors.length}):`);
  [...new Set(consoleErrors)].slice(0, 15).forEach((e) => console.log(`  ! ${e}`));
}
if (netErrors.length) {
  console.log(`\nRESPOSTAS HTTP >=400 (${netErrors.length}):`);
  [...new Set(netErrors)].slice(0, 15).forEach((e) => console.log(`  ! ${e}`));
}
console.log('');
process.exit(fail ? 1 : 0);
