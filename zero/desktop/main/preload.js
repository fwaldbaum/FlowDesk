// The only bridge between the launcher UI and the main process. No Node APIs leak into the page.
const { contextBridge, ipcRenderer } = require('electron');

const call = async (channel, ...args) => {
  const res = await ipcRenderer.invoke(channel, ...args);
  if (!res?.ok) {
    const err = new Error(res?.error || 'Algo salió mal.');
    err.status = res?.status ?? 0;
    err.code = res?.code ?? '';
    throw err;
  }
  return res.data;
};

contextBridge.exposeInMainWorld('zero', {
  info: () => call('zero:info'),
  login: (email, password) => call('zero:login', email, password),
  logout: () => call('zero:logout'),
  api: (method, route, body) => call('zero:api', method, route, body),
  openApp: (id) => call('zero:open-app', id),
  openInBrowser: (id) => call('zero:open-in-browser', id),
  install: (id, withShortcut) => call('zero:install', id, withShortcut),
  uninstall: (id) => call('zero:uninstall', id),
  shortcut: (id) => call('zero:shortcut', id),
  web: (next) => call('zero:web', next),
  external: (where) => call('zero:external', where),
  onSessionEnded: (fn) => {
    const listener = () => fn();
    ipcRenderer.on('zero:session-ended', listener);
    return () => ipcRenderer.removeListener('zero:session-ended', listener);
  },
});
