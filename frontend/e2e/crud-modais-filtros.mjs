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
      await page.screenshot({ path: `fail2-${LABEL}-${idx}.png` });
      const txt = await page.evaluate(() => document.body.innerText.slice(0, 400));
      console.log(`        [diag] url=${page.url()}`);
      console.log(`        [diag] tela: ${txt.replace(/\n+/g, ' | ').slice(0, 350)}`);
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
const waitNoText = (page, t, timeout = 45000) =>
  page.waitForFunction((x) => !document.body.innerText.includes(x), { timeout }, t);

async function setInput(page, selector, value) {
  const el = await page.waitForSelector(selector, { visible: true, timeout: 45000 });
  await el.click({ clickCount: 3 });
  await page.keyboard.press('Backspace');
  await el.type(value, { delay: 8 });
}

async function clickInDialog(page, text) {
  const dialogs = [];
  for (const h of await page.$$('[role="dialog"], [role="alertdialog"]')) {
    const vis = await h.evaluate((el) => el.getBoundingClientRect().height > 0);
    if (vis) dialogs.push(h);
  }
  if (!dialogs.length) throw new Error('nenhum dialog aberto');
  await clickByText(page, 'button', text, { scope: dialogs[dialogs.length - 1] });
}

async function openMenuNear(page, text) {
  const cont = (
    await page.evaluateHandle((txt) => {
      const leaf = [...document.querySelectorAll('*')].find(
        (el) => el.children.length === 0 && (el.textContent || '').trim() === txt
      );
      let node = leaf;
      while (node && !node.querySelector?.('button[aria-haspopup="menu"]')) node = node.parentElement;
      return node;
    }, text)
  ).asElement();
  if (!cont) throw new Error(`nao achei container com menu perto de "${text}"`);
  await cont.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  await cont.hover();
  await sleep(250);
  const trigger = await cont.$('button[aria-haspopup="menu"]');
  await trigger.hover();
  await trigger.click();
  await page.waitForSelector('[role="menu"]', { visible: true, timeout: 5000 });
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--window-size=1440,1000'],
  defaultViewport: { width: 1440, height: 1000 },
});
const page = await browser.newPage();
page.on('console', (m) => {
  if (m.type() === 'error' && !/favicon|ERR_/.test(m.text())) consoleErrors.push(m.text().slice(0, 300));
});
page.on('pageerror', (e) => consoleErrors.push(`[pageerror] ${e.message}`.slice(0, 300)));
page.on('response', (r) => {
  if (r.status() >= 400 && !/favicon/.test(r.url()))
    netErrors.push(`${r.status()} ${r.request().method()} ${r.url().slice(0, 140)}`);
});

console.log(`\n=== ${LABEL} rodada 2 (${BASE}) — prefixo: ${TAG} ===\n`);

let mangaUrl = null;
let listId = null;
const mangaId = () => mangaUrl.split('/').pop();

// ---- 1. CRUD da tela de Sites ----
await step('admin/sites: criar site', async () => {
  await page.goto(`${BASE}/admin/sites`, { waitUntil: 'networkidle2', timeout: 90000 });
  await waitText(page, 'Manage manga reading sites');
  await clickByText(page, 'button', 'Add Site', { exact: false });
  await setInput(page, 'input#name', `${TAG}-site`);
  await setInput(page, 'input#url', 'https://exemplo-e2e.test');
  await setInput(page, 'input#language', 'pt-BR');
  await clickInDialog(page, 'Create');
  await waitText(page, `${TAG}-site`);
  const rows = await api('/admin/sites');
  if (!rows.some((r) => r.name === `${TAG}-site`)) throw new Error('API nao mostra o site criado');
});

await step('admin/sites: editar site', async () => {
  await openMenuNear(page, `${TAG}-site`);
  await clickByText(page, '[role="menuitem"]', 'Edit');
  await sleep(400);
  await setInput(page, 'input#name', `${TAG}-site-editado`);
  await clickInDialog(page, 'Save');
  await waitText(page, `${TAG}-site-editado`);
  const rows = await api('/admin/sites');
  if (!rows.some((r) => r.name === `${TAG}-site-editado`)) throw new Error('API nao refletiu a edicao');
});

await step('admin/sites: excluir site', async () => {
  await openMenuNear(page, `${TAG}-site-editado`);
  await clickByText(page, '[role="menuitem"]', 'Delete');
  await waitText(page, 'Confirm Delete');
  await clickInDialog(page, 'Delete');
  await waitNoText(page, `${TAG}-site-editado`);
  const rows = await api('/admin/sites');
  if (rows.some((r) => (r.name || '').startsWith(TAG))) throw new Error('API ainda tem o site');
});

// ---- preparo: um manga e uma lista de teste ----
await step('preparo: criar manga e lista de teste', async () => {
  const m = await api('/mangas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ primaryTitle: `${TAG}-manga` }),
  });
  mangaUrl = `${BASE}/mangas/${m.id}`;
  const l = await api('/lists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: `${TAG}-lista`, color: '#3b82f6' }),
  });
  listId = l.id;
});

// ---- 2. Add to List / remover, pela tela de detalhe ----
await step('manga: adicionar a lista pelo modal', async () => {
  await page.goto(mangaUrl, { waitUntil: 'networkidle2', timeout: 90000 });
  await waitText(page, `${TAG}-manga`);
  await clickByText(page, 'button', 'Add to List', { exact: false });
  await waitText(page, 'Add to Reading List');
  await clickByText(page, 'button', `${TAG}-lista`, { exact: false });
  await sleep(1500);
  const inLists = await api(`/lists/manga/${mangaId()}`);
  if (!inLists.some((l) => l.id === listId)) throw new Error('API nao mostra o manga na lista');
});

await step('manga: remover da lista pelo mesmo modal', async () => {
  await clickByText(page, 'button', `${TAG}-lista`, { exact: false });
  await sleep(1500);
  const inLists = await api(`/lists/manga/${mangaId()}`);
  if (inLists.some((l) => l.id === listId)) throw new Error('API ainda mostra o manga na lista');
});

// ---- 3. Lembrete: criar e excluir ----
await step('manga: criar lembrete rapido (1 dia)', async () => {
  await page.goto(mangaUrl, { waitUntil: 'networkidle2', timeout: 90000 });
  await waitText(page, `${TAG}-manga`);
  await clickByText(page, 'button', 'Reminder', { exact: false });
  await waitText(page, 'Lembretes');
  await clickByText(page, 'button', '1 dia', { exact: true });
  await sleep(1800);
  const all = await api('/reminders');
  const mine = all.filter((r) => (r.mangaId ?? r.manga_id) === mangaId());
  if (!mine.length) throw new Error('API nao mostra lembrete para esse manga');
});

await step('manga: excluir lembrete', async () => {
  const before = (await api('/reminders')).filter((r) => (r.mangaId ?? r.manga_id) === mangaId()).length;
  const trash = await page.evaluateHandle(() => {
    const dlg = [...document.querySelectorAll('[role="dialog"]')].pop();
    const btns = [...dlg.querySelectorAll('button')];
    return btns.find((b) => b.querySelector('svg.lucide-trash-2, svg.lucide-trash2'));
  });
  const el = trash.asElement();
  if (!el) throw new Error('nao achei o botao de excluir lembrete no modal');
  await el.click();
  await sleep(1800);
  const after = (await api('/reminders')).filter((r) => (r.mangaId ?? r.manga_id) === mangaId()).length;
  if (after >= before) throw new Error(`lembretes antes=${before} depois=${after}`);
});

// ---- 4. Filtros da listagem ----
await step('mangas: busca por titulo filtra o grid', async () => {
  await page.goto(`${BASE}/mangas`, { waitUntil: 'networkidle2', timeout: 90000 });
  await waitText(page, 'Showing');
  const totalAntes = await page.$eval('body', (b) =>
    Number((b.innerText.match(/of ([\d.,]+) results/) || [])[1]?.replace(/[.,]/g, '') || 0)
  );
  await setInput(page, 'input[placeholder="Search by title..."]', `${TAG}-manga`);
  // o campo tem debounce: esperar o TOTAL mudar, nao o titulo aparecer
  // (ele ja aparece na lista sem filtro, por estar ordenada por updated_at desc)
  await page.waitForFunction(
    (t) => {
      const m = document.body.innerText.match(/of ([\d.,]+) results/);
      return m && Number(m[1].replace(/[.,]/g, '')) !== t;
    },
    { timeout: 45000 },
    totalAntes
  );
  const n = await page.$eval('body', (b) =>
    Number((b.innerText.match(/of ([\d.,]+) results/) || [])[1]?.replace(/[.,]/g, '') || 0)
  );
  if (n !== 1) throw new Error(`busca retornou ${n} resultados, esperado 1`);
});

await step('mangas: filtro de status altera o total', async () => {
  await page.goto(`${BASE}/mangas`, { waitUntil: 'networkidle2', timeout: 90000 });
  await waitText(page, 'Showing');
  const totalAll = await page.$eval('body', (b) =>
    Number((b.innerText.match(/of ([\d.,]+) results/) || [])[1]?.replace(/[.,]/g, '') || 0)
  );
  await clickByText(page, 'button[role="combobox"]', 'Status', { exact: false });
  // os itens do filtro sao <div> com onClick, sem role — clicar pelo <span> do nome
  await page.waitForSelector('[data-radix-popper-content-wrapper]', { visible: true, timeout: 8000 });
  const pop = await page.$('[data-radix-popper-content-wrapper]');
  await clickByText(page, 'span', 'Completed', { exact: true, scope: pop });
  await page.waitForFunction(
    (t) => {
      const m = document.body.innerText.match(/of ([\d.,]+) results/);
      return m && Number(m[1].replace(/[.,]/g, '')) !== t;
    },
    { timeout: 45000 },
    totalAll
  );
});

// ---- limpeza ----
await browser.close();

const swept = [];
try {
  if (listId) {
    await fetch(`${API}/lists/${listId}`, { method: 'DELETE' });
    swept.push(`lista ${TAG}-lista`);
  }
  if (mangaUrl) {
    await fetch(`${API}/mangas/${mangaId()}`, { method: 'DELETE' });
    swept.push(`manga ${TAG}-manga`);
  }
  const sites = await api('/admin/sites');
  for (const s of sites.filter((x) => (x.name || '').startsWith(TAG))) {
    await fetch(`${API}/admin/sites/${s.id}`, { method: 'DELETE' });
    swept.push(`site ${s.name}`);
  }
} catch (e) {
  console.log(`  aviso na limpeza: ${e.message}`);
}

const pass = results.filter((r) => r.ok).length;
console.log(`\n--- ${LABEL} rodada 2: ${pass}/${results.length} passaram ---`);
results.filter((r) => !r.ok).forEach((r) => console.log(`  * ${r.name}: ${r.error}`));
if (consoleErrors.length) {
  console.log(`\nERROS DE CONSOLE (${consoleErrors.length}):`);
  [...new Set(consoleErrors)].slice(0, 10).forEach((e) => console.log(`  ! ${e}`));
}
if (netErrors.length) {
  console.log(`\nHTTP >=400 (${netErrors.length}):`);
  [...new Set(netErrors)].slice(0, 10).forEach((e) => console.log(`  ! ${e}`));
}
if (swept.length) console.log(`\nlimpeza: ${swept.join(', ')}`);
console.log('');
process.exit(results.length - pass ? 1 : 0);
