// ZERO desktop QA: drives the real Electron app against local ZERO (8080) and Repeat (8090).
const { _electron: electron } = require('playwright');
const fs = require('fs');
const path = require('path');
const os = require('os');
const APP = require('path').resolve(__dirname);
const OUT = process.argv[2];
const results = [];
const check = async (label, fn) => {
  try {
    const d = await fn();
    results.push(`PASS ${label} ${d || ''}`);
  } catch (e) {
    results.push(`FAIL ${label} :: ${e.message.split('\n')[0]}`);
  }
  console.log(results[results.length - 1]);
};

(async () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'zdhome-'));
  fs.mkdirSync(path.join(home, 'Desktop'));
  const launch = () =>
    electron.launch({
      executablePath: path.join(APP, 'node_modules/electron/dist/electron'),
      args: [APP, '--no-sandbox', `--user-data-dir=${path.join(home, 'data')}`],
      env: { ...process.env, HOME: home, ZERO_SERVER: 'http://127.0.0.1:8080', ELECTRON_DISABLE_SECURITY_WARNINGS: '1' },
    });
  let app = await launch();
  let win = await app.firstWindow();
  await win.setViewportSize({ width: 1280, height: 800 }).catch(() => {});
  const errors = [];
  win.on('pageerror', (e) => errors.push(e.message));

  await check('Pantalla de inicio de sesión', async () => {
    await win.getByRole('heading', { name: 'Inicia sesión' }).waitFor({ timeout: 20000 });
    await win.waitForTimeout(1200);
    await win.screenshot({ path: `${OUT}/01-login.png` });
  });
  await check('Contraseña incorrecta', async () => {
    await win.getByPlaceholder('tu@correo.cl').fill('desktop@ejemplo.cl');
    await win.getByPlaceholder('Tu contraseña').fill('mala-clave');
    await win.getByRole('button', { name: 'Entrar' }).click();
    await win.getByText('El correo o la contraseña no coinciden.').waitFor();
  });
  await check('Iniciar sesión', async () => {
    await win.getByPlaceholder('Tu contraseña').fill('Prueba-2026!');
    await win.getByRole('button', { name: 'Entrar' }).click();
    await win.getByText('Hola, Marcelo', { exact: false }).first().waitFor({ timeout: 15000 });
    await win.waitForTimeout(1500);
    await win.screenshot({ path: `${OUT}/02-inicio.png` });
  });
  await check('Instalar Repeat con acceso directo', async () => {
    const card = win.locator('div', { has: win.getByText('Repeat', { exact: true }) }).filter({ has: win.getByRole('button', { name: 'Instalar' }) }).last();
    await card.getByRole('button', { name: 'Instalar' }).click();
    await win.getByRole('heading', { name: 'Instalar Repeat' }).waitFor();
    await win.waitForTimeout(500);
    await win.screenshot({ path: `${OUT}/03-instalar.png` });
    await win.getByRole('dialog').getByRole('button', { name: 'Instalar' }).click();
    await win.getByRole('heading', { name: 'Repeat está lista' }).waitFor({ timeout: 10000 });
    const desk = fs.readdirSync(path.join(home, 'Desktop'));
    const menu = fs.readdirSync(path.join(home, '.local/share/applications'));
    if (!desk.includes('zero-repeat.desktop') || !menu.includes('zero-repeat.desktop')) throw new Error('sin acceso directo: ' + desk);
    const entry = fs.readFileSync(path.join(home, 'Desktop/zero-repeat.desktop'), 'utf8');
    if (!/--open-app=repeat/.test(entry)) throw new Error('Exec sin --open-app');
    return 'escritorio + menú, ' + (entry.match(/Icon=.*/) || [''])[0].split('/').pop();
  });
  await check('Abrir Repeat en su ventana con sesión ZERO (SSO)', async () => {
    const [appWin] = await Promise.all([app.waitForEvent('window', { timeout: 20000 }), win.getByRole('dialog').getByRole('button', { name: 'Abrir Repeat' }).click()]);
    await appWin.waitForLoadState('domcontentloaded');
    await appWin.waitForURL((u) => u.pathname.startsWith('/panel'), { timeout: 20000 });
    await appWin.waitForTimeout(1500);
    await appWin.screenshot({ path: `${OUT}/04-repeat-ventana.png` });
    return appWin.url().replace('http://127.0.0.1:8090', '');
  });
  await check('Mis apps', async () => {
    await win.locator('aside').getByRole('button', { name: 'Mis apps' }).click();
    await win.getByRole('heading', { name: 'Mis apps' }).waitFor();
    await win.waitForTimeout(800);
    await win.screenshot({ path: `${OUT}/05-mis-apps.png` });
  });
  await check('Cambiar nombre', async () => {
    await win.locator('aside').getByRole('button', { name: 'Cuenta', exact: true }).click();
    await win.locator('input[maxlength="120"]').fill('Marcelo Acosta');
    await win.getByRole('button', { name: 'Guardar' }).click();
    await win.getByText('Nombre actualizado').waitFor();
    await win.screenshot({ path: `${OUT}/06-cuenta.png` });
  });
  await check('Plan y pagos', async () => {
    await win.locator('aside').getByRole('button', { name: 'Plan y pagos' }).click();
    await win.getByText('Mejora tu plan').waitFor({ timeout: 10000 });
    await win.waitForTimeout(1000);
    await win.screenshot({ path: `${OUT}/07-plan.png` });
  });
  await check('Seguridad: dispositivos', async () => {
    await win.locator('aside').getByRole('button', { name: 'Seguridad' }).click();
    await win.getByText('Este computador', { exact: true }).waitFor();
    await win.waitForTimeout(600);
    await win.screenshot({ path: `${OUT}/08-seguridad.png` });
  });
  await check('Sesión guardada al reabrir la app', async () => {
    await app.close();
    app = await launch();
    win = await app.firstWindow();
    await win.getByText('Hola, Marcelo', { exact: false }).first().waitFor({ timeout: 20000 });
  });
  await check('Abrir desde el acceso directo (--open-app)', async () => {
    await app.close();
    app = await electron.launch({
      executablePath: path.join(APP, 'node_modules/electron/dist/electron'),
      args: [APP, '--no-sandbox', `--user-data-dir=${path.join(home, 'data')}`, '--open-app=repeat'],
      env: { ...process.env, HOME: home, ZERO_SERVER: 'http://127.0.0.1:8080' },
    });
    const w = await app.firstWindow();
    await w.waitForURL((u) => u.port === '8090', { timeout: 20000 });
    const titles = await Promise.all(app.windows().map((x) => x.title()));
    return `ventanas: ${titles.join(' | ')}`;
  });
  await check('Sesión cerrada desde otro lado → vuelve al login', async () => {
    await app.close();
    const fetchJson = async (m, p, t, body) => (await fetch('http://127.0.0.1:8080/api/desktop' + p, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }, body: body ? JSON.stringify(body) : undefined })).json();
    const other = await fetchJson('POST', '/login', null, { email: 'desktop@ejemplo.cl', password: 'Prueba-2026!', device_name: 'Otro PC', platform: 'win32' });
    await fetchJson('POST', '/devices/revoke-others', other.token);
    app = await launch();
    win = await app.firstWindow();
    await win.getByRole('heading', { name: 'Inicia sesión' }).waitFor({ timeout: 20000 });
  });
  console.log('JS errors:', errors.length ? errors : 'none');
  await app.close();
})().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
