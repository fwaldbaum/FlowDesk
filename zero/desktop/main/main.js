// ZERO desktop: account and launcher for the ZERO apps. The renderer never sees the device token; every API
// call goes through this process, which adds it and talks to zerosolutions.cl.
const { app, BrowserWindow, ipcMain, shell, safeStorage, net, session, Menu, nativeImage, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const SERVER = (process.env.ZERO_SERVER || 'https://zerosolutions.cl').replace(/\/+$/, '');
const SERVER_ORIGIN = new URL(SERVER).origin;
const IS_MAC = process.platform === 'darwin';
const DEV_URL = process.env.ZERO_DEV_URL || '';

app.setName('ZERO');
if (process.platform === 'win32') app.setAppUserModelId('cl.zerosolutions.desktop');

// ---- Persistent state (token encrypted with the OS keychain when available) ----------------------------------------

const dataDir = () => app.getPath('userData');
const statePath = () => path.join(dataDir(), 'state.json');
const tokenPath = () => path.join(dataDir(), 'session.bin');

function readState() {
  try {
    return { installed: [], bounds: null, ...JSON.parse(fs.readFileSync(statePath(), 'utf8')) };
  } catch {
    return { installed: [], bounds: null };
  }
}
function writeState(patch) {
  const next = { ...readState(), ...patch };
  fs.mkdirSync(dataDir(), { recursive: true });
  fs.writeFileSync(statePath(), JSON.stringify(next, null, 2));
  return next;
}

function readToken() {
  try {
    const raw = fs.readFileSync(tokenPath());
    if (raw.subarray(0, 4).toString() === 'enc:') return safeStorage.decryptString(raw.subarray(4));
    if (raw.subarray(0, 4).toString() === 'raw:') return raw.subarray(4).toString();
  } catch {
    /* no session */
  }
  return '';
}
function writeToken(token) {
  fs.mkdirSync(dataDir(), { recursive: true });
  if (!token) {
    fs.rmSync(tokenPath(), { force: true });
    return;
  }
  const blob = safeStorage.isEncryptionAvailable()
    ? Buffer.concat([Buffer.from('enc:'), safeStorage.encryptString(token)])
    : Buffer.concat([Buffer.from('raw:'), Buffer.from(token)]);
  fs.writeFileSync(tokenPath(), blob, { mode: 0o600 });
}

// ---- API ---------------------------------------------------------------------------------------------------------------

class ApiError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function api(method, route, body) {
  const token = readToken();
  let res;
  try {
    res = await net.fetch(`${SERVER}/api/desktop${route}`, {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': `ZERO-Desktop/${app.getVersion()} (${process.platform})`,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Sin conexión con ZERO. Revisa tu internet.', 'NETWORK');
  }
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }
  if (!res.ok) {
    if (res.status === 401 && token && route !== '/login') {
      writeToken('');
      mainWindow?.webContents.send('zero:session-ended');
    }
    throw new ApiError(res.status, data.error || 'No pudimos completar la acción. Inténtalo de nuevo.', data.code);
  }
  return data;
}

// Errors cross the IPC boundary as plain values, so the renderer gets the Spanish message.
const handle = (channel, fn) =>
  ipcMain.handle(channel, async (event, ...args) => {
    if (!isTrustedSender(event)) return { ok: false, error: 'Origen no permitido.' };
    try {
      return { ok: true, data: await fn(...args) };
    } catch (e) {
      return { ok: false, error: e.message, status: e.status ?? 0, code: e.code ?? '' };
    }
  });

function isTrustedSender(event) {
  const url = event.senderFrame?.url || '';
  return event.sender === mainWindow?.webContents && (DEV_URL ? url.startsWith(DEV_URL) : url.startsWith('file://'));
}

// Only these API routes are reachable from the renderer.
const ALLOWED = [
  ['GET', /^\/me$/],
  ['POST', /^\/profile$/],
  ['POST', /^\/password$/],
  ['POST', /^\/verify\/resend$/],
  ['GET', /^\/devices$/],
  ['DELETE', /^\/devices\/\d+$/],
  ['POST', /^\/devices\/revoke-others$/],
  ['GET', /^\/apps$/],
  ['GET', /^\/billing$/],
];

// ---- App catalogue cache (for windows opened from shortcuts) ---------------------------------------------------------

let appsCache = [];
async function loadApps() {
  const res = await api('GET', '/apps');
  appsCache = res.items;
  return res;
}

// ---- Windows -----------------------------------------------------------------------------------------------------------

let mainWindow = null;
const appWindows = new Map();

function iconPath() {
  const p = path.join(__dirname, '..', 'build', 'icon.png');
  return fs.existsSync(p) ? p : undefined;
}

function createMainWindow() {
  const { bounds } = readState();
  mainWindow = new BrowserWindow({
    width: bounds?.width || 1180,
    height: bounds?.height || 760,
    x: bounds?.x,
    y: bounds?.y,
    minWidth: 900,
    minHeight: 600,
    show: false,
    title: 'ZERO',
    icon: iconPath(),
    backgroundColor: '#F7F9FD',
    titleBarStyle: IS_MAC ? 'hiddenInset' : 'hidden',
    titleBarOverlay: IS_MAC ? false : { color: '#00000000', symbolColor: '#64748B', height: 44 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('close', () => writeState({ bounds: mainWindow.getBounds() }));
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  // The launcher never navigates away or opens popups: links go to the system browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    openExternalSafe(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (e, url) => {
    if (!(DEV_URL && url.startsWith(DEV_URL))) {
      e.preventDefault();
      openExternalSafe(url);
    }
  });
  if (DEV_URL) mainWindow.loadURL(DEV_URL);
  else mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

function knownOrigins() {
  return new Set([SERVER_ORIGIN, ...appsCache.map((a) => a.origin)]);
}

function openExternalSafe(url) {
  try {
    const u = new URL(url);
    if (u.protocol === 'https:' || u.protocol === 'mailto:' || (u.protocol === 'http:' && process.env.ZERO_SERVER)) shell.openExternal(u.toString());
  } catch {
    /* ignore malformed */
  }
}

async function openAppWindow(id) {
  if (!appsCache.length) await loadApps();
  const meta = appsCache.find((a) => a.id === id);
  if (!meta) throw new ApiError(404, 'Esa aplicación no está disponible.');
  const existing = appWindows.get(id);
  if (existing && !existing.isDestroyed()) {
    if (existing.isMinimized()) existing.restore();
    existing.focus();
    return { reused: true };
  }
  const { url } = await api('POST', `/open/${id}`);
  await ensureAppIcon(meta);
  const win = new BrowserWindow({
    width: 1320,
    height: 840,
    minWidth: 760,
    minHeight: 520,
    title: meta.name,
    icon: appIconFile(meta) || iconPath(),
    backgroundColor: '#FFFFFF',
    autoHideMenuBar: true,
    webPreferences: {
      partition: `persist:zero-app-${id}`,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  appWindows.set(id, win);
  win.on('closed', () => appWindows.delete(id));
  win.webContents.on('page-title-updated', (e, title) => win.setTitle(title ? `${meta.name} · ${title}` : meta.name));
  // Stay inside the app (and ZERO); anything else opens in the system browser.
  const allowed = (target) => {
    try {
      return knownOrigins().has(new URL(target).origin);
    } catch {
      return false;
    }
  };
  win.webContents.setWindowOpenHandler(({ url: target }) => {
    if (allowed(target)) win.loadURL(target);
    else openExternalSafe(target);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, target) => {
    if (!allowed(target)) {
      e.preventDefault();
      openExternalSafe(target);
    }
  });
  // Payment pages and similar outside links open in the browser.
  await win.loadURL(url);
  return { reused: false };
}

// ---- Install / shortcuts ----------------------------------------------------------------------------------------------

function iconsDir() {
  const d = path.join(dataDir(), 'icons');
  fs.mkdirSync(d, { recursive: true });
  return d;
}

/** Best icon file already on disk for an app: .ico (Windows), .png, or .svg (Linux menus accept SVG). */
function appIconFile(meta) {
  const base = path.join(iconsDir(), meta.id);
  if (process.platform === 'win32' && fs.existsSync(`${base}.ico`)) return `${base}.ico`;
  if (fs.existsSync(`${base}.png`)) return `${base}.png`;
  if (process.platform === 'linux' && fs.existsSync(`${base}.svg`)) return `${base}.svg`;
  return undefined;
}

/** Renders the app mark (SVG from ZERO) to a 256 px PNG and an .ico that wraps it, once per app. */
async function ensureAppIcon(meta) {
  const base = path.join(iconsDir(), meta.id);
  const mark = meta.mark && !meta.mark.includes('xmlns=') ? meta.mark.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"') : meta.mark;
  if (mark && !fs.existsSync(`${base}.svg`)) fs.writeFileSync(`${base}.svg`, mark);
  if (fs.existsSync(`${base}.png`) || !meta.mark) return;
  const win = new BrowserWindow({ show: false, width: 256, height: 256, frame: false, transparent: true, webPreferences: { offscreen: true, sandbox: true, javascript: false } });
  try {
    const svg = Buffer.from(mark).toString('base64');
    const html = `<html><body style="margin:0;background:transparent"><div style="width:256px;height:256px;display:grid;place-items:center;background:#fff;border-radius:56px"><img src="data:image/svg+xml;base64,${svg}" style="width:176px;height:176px"></div></body></html>`;
    await win.loadURL(`data:text/html;base64,${Buffer.from(html).toString('base64')}`);
    await new Promise((r) => setTimeout(r, 150));
    const png = (await win.webContents.capturePage()).resize({ width: 256, height: 256 }).toPNG();
    fs.writeFileSync(`${base}.png`, png);
    // ICO with one embedded PNG (valid since Windows Vista).
    const header = Buffer.alloc(22);
    header.writeUInt16LE(0, 0);
    header.writeUInt16LE(1, 2);
    header.writeUInt16LE(1, 4);
    header.writeUInt8(0, 6); // 256 px
    header.writeUInt8(0, 7);
    header.writeUInt16LE(1, 10);
    header.writeUInt16LE(32, 12);
    header.writeUInt32LE(png.length, 14);
    header.writeUInt32LE(22, 18);
    fs.writeFileSync(`${base}.ico`, Buffer.concat([header, png]));
  } catch {
    /* the app still works with the ZERO icon */
  } finally {
    win.destroy();
  }
}

function launcherCommand(id) {
  // AppImage runs from a temporary mount: the stable path is the APPIMAGE file itself.
  const exe = process.env.APPIMAGE || process.execPath;
  const args = app.isPackaged ? [`--open-app=${id}`] : [path.join(__dirname, '..'), `--open-app=${id}`];
  return { exe, args };
}

function desktopDir() {
  try {
    return app.getPath('desktop');
  } catch {
    return path.join(os.homedir(), 'Desktop');
  }
}

function createShortcut(meta) {
  const { exe, args } = launcherCommand(meta.id);
  if (process.platform === 'win32') {
    const lnk = path.join(desktopDir(), `${meta.name}.lnk`);
    const ok = shell.writeShortcutLink(lnk, 'create', {
      target: exe,
      args: args.map((a) => `"${a}"`).join(' '),
      description: `${meta.name} · ${meta.category}`,
      icon: appIconFile(meta)?.endsWith('.ico') ? appIconFile(meta) : exe,
      iconIndex: 0,
      appUserModelId: 'cl.zerosolutions.desktop',
    });
    if (!ok) throw new ApiError(0, 'No pudimos crear el acceso directo.');
    return { where: 'el escritorio' };
  }
  if (process.platform === 'linux') {
    const quote = (s) => `"${String(s).replace(/(["\\$`])/g, '\\$1')}"`;
    const entry = [
      '[Desktop Entry]',
      'Type=Application',
      `Name=${meta.name}`,
      `Comment=${meta.category} · ZERO`,
      `Exec=${[exe, ...args].map(quote).join(' ')}`,
      `Icon=${appIconFile(meta) || 'applications-internet'}`,
      'Terminal=false',
      'Categories=Office;Network;',
      `StartupWMClass=ZERO`,
      '',
    ].join('\n');
    const appsDir = path.join(os.homedir(), '.local', 'share', 'applications');
    fs.mkdirSync(appsDir, { recursive: true });
    const menuFile = path.join(appsDir, `zero-${meta.id}.desktop`);
    fs.writeFileSync(menuFile, entry, { mode: 0o755 });
    let where = 'el menú de aplicaciones';
    const desk = desktopDir();
    if (fs.existsSync(desk)) {
      fs.writeFileSync(path.join(desk, `zero-${meta.id}.desktop`), entry, { mode: 0o755 });
      where = 'el escritorio y el menú de aplicaciones';
    }
    return { where };
  }
  // macOS: apps launch from ZERO's Dock menu (right click on the ZERO icon).
  return { where: 'el menú del ícono de ZERO en el Dock' };
}

function removeShortcut(meta) {
  const files =
    process.platform === 'win32'
      ? [path.join(desktopDir(), `${meta.name}.lnk`)]
      : process.platform === 'linux'
        ? [path.join(os.homedir(), '.local', 'share', 'applications', `zero-${meta.id}.desktop`), path.join(desktopDir(), `zero-${meta.id}.desktop`)]
        : [];
  files.forEach((f) => fs.rmSync(f, { force: true }));
}

function refreshLaunchMenus() {
  const installed = readState().installed;
  const items = installed.map((id) => appsCache.find((a) => a.id === id)).filter(Boolean);
  if (IS_MAC && app.dock) {
    app.dock.setMenu(Menu.buildFromTemplate(items.map((m) => ({ label: `Abrir ${m.name}`, click: () => openAppWindow(m.id).catch(showError) }))));
  }
  if (process.platform === 'win32') {
    const { exe, args } = launcherCommand('');
    app.setUserTasks(
      items.map((m) => ({
        program: exe,
        arguments: [...args.slice(0, -1), `--open-app=${m.id}`].map((a) => `"${a}"`).join(' '),
        iconPath: exe,
        iconIndex: 0,
        title: `Abrir ${m.name}`,
        description: m.category,
      })),
    );
  }
}

function showError(e) {
  dialog.showErrorBox('ZERO', e?.message || 'Algo salió mal.');
}

// ---- IPC ---------------------------------------------------------------------------------------------------------------

function registerIpc() {
  handle('zero:info', async () => ({
    version: app.getVersion(),
    platform: process.platform,
    server: SERVER,
    signedIn: Boolean(readToken()),
    installed: readState().installed,
    encrypted: safeStorage.isEncryptionAvailable(),
  }));
  handle('zero:login', async (email, password) => {
    const res = await api('POST', '/login', {
      email: String(email || ''),
      password: String(password || ''),
      device_name: `${os.hostname().replace(/\.local$/, '')}`.slice(0, 60) || 'Computador',
      platform: process.platform,
    });
    writeToken(res.token);
    return { user: res.user };
  });
  handle('zero:logout', async () => {
    await api('POST', '/logout').catch(() => {});
    writeToken('');
    for (const w of appWindows.values()) if (!w.isDestroyed()) w.close();
    return true;
  });
  handle('zero:api', async (method, route, body) => {
    const m = String(method).toUpperCase();
    if (!ALLOWED.some(([am, re]) => am === m && re.test(String(route)))) throw new ApiError(403, 'Acción no permitida.');
    const res = await api(m, String(route), body);
    if (route === '/apps') {
      appsCache = res.items;
      refreshLaunchMenus();
    }
    return res;
  });
  handle('zero:open-app', async (id) => openAppWindow(String(id)));
  handle('zero:open-in-browser', async (id) => {
    const { url } = await api('POST', `/open/${String(id)}`);
    openExternalSafe(url);
    return true;
  });
  handle('zero:install', async (id, withShortcut) => {
    if (!appsCache.length) await loadApps();
    const meta = appsCache.find((a) => a.id === id);
    if (!meta) throw new ApiError(404, 'Esa aplicación no está disponible.');
    const installed = Array.from(new Set([...readState().installed, meta.id]));
    writeState({ installed });
    await ensureAppIcon(meta);
    const shortcut = withShortcut ? createShortcut(meta) : null;
    refreshLaunchMenus();
    return { installed, shortcut };
  });
  handle('zero:shortcut', async (id) => {
    const meta = appsCache.find((a) => a.id === id);
    if (!meta) throw new ApiError(404, 'Esa aplicación no está disponible.');
    await ensureAppIcon(meta);
    return createShortcut(meta);
  });
  handle('zero:uninstall', async (id) => {
    const meta = appsCache.find((a) => a.id === id);
    const installed = readState().installed.filter((x) => x !== id);
    writeState({ installed });
    if (meta) removeShortcut(meta);
    const w = appWindows.get(id);
    if (w && !w.isDestroyed()) w.close();
    // Forget the app's own sign-in, cookies and cache on this computer.
    await session.fromPartition(`persist:zero-app-${id}`).clearStorageData();
    refreshLaunchMenus();
    return { installed };
  });
  handle('zero:web', async (next) => {
    const { url } = await api('POST', '/web-link', { next: String(next || '/cuenta') });
    openExternalSafe(url);
    return true;
  });
  handle('zero:external', async (where) => {
    const pages = { registro: '/registro', recuperar: '/recuperar', sitio: '/', precios: '/precios', flaticon: 'https://www.flaticon.com/uicons', reactbits: 'https://reactbits.dev' };
    const target = pages[where];
    if (!target) throw new ApiError(400, 'Enlace no permitido.');
    openExternalSafe(target.startsWith('http') ? target : `${SERVER}${target}`);
    return true;
  });
}

// ---- Startup -----------------------------------------------------------------------------------------------------------

function appArg(argv) {
  const a = argv.find((x) => x.startsWith('--open-app='));
  return a ? a.slice('--open-app='.length).replace(/[^a-z0-9-]/g, '') : '';
}

async function openFromShortcut(id) {
  if (!readToken()) {
    if (!mainWindow) createMainWindow();
    return;
  }
  try {
    await openAppWindow(id);
  } catch (e) {
    if (!mainWindow) createMainWindow();
    if (e.status !== 401) showError(e);
  }
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', (_e, argv) => {
    const id = appArg(argv);
    if (id) openFromShortcut(id);
    else if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    } else createMainWindow();
  });

  app.whenReady().then(async () => {
    // The launcher's own pages: strict CSP and no permission prompts.
    session.defaultSession.webRequest.onHeadersReceived((details, cb) => {
      if (details.url.startsWith('file://')) {
        cb({ responseHeaders: { ...details.responseHeaders, 'Content-Security-Policy': ["default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; script-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"] } });
      } else cb({});
    });
    session.defaultSession.setPermissionRequestHandler((_wc, _perm, cb) => cb(false));
    if (!IS_MAC) Menu.setApplicationMenu(null);
    registerIpc();
    if (readToken()) loadApps().then(refreshLaunchMenus).catch(() => {});
    const id = appArg(process.argv);
    if (id) await openFromShortcut(id);
    else createMainWindow();
    if (app.dock && iconPath()) app.dock.setIcon(nativeImage.createFromPath(iconPath()));
  });

  app.on('activate', () => {
    if (!mainWindow) createMainWindow();
  });
  app.on('window-all-closed', () => {
    if (!IS_MAC) app.quit();
  });
  app.on('web-contents-created', (_e, contents) => {
    contents.on('will-attach-webview', (e) => e.preventDefault());
  });
}
