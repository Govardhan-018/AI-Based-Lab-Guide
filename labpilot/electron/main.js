// Electron main process — boots the Next.js server and opens it in a desktop window.
const { app, BrowserWindow, session, shell } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const waitOn = require("wait-on");

const PORT = process.env.PORT || 3000;
const URL = `http://localhost:${PORT}`;
const isDev = process.env.ELECTRON_DEV === "1";

let serverProcess = null;
let mainWindow = null;

// Store all JSON data under the OS user-data directory so it persists and is writable
// even when the app is packaged.
const DATA_DIR = path.join(app.getPath("userData"), "data");
process.env.LABPILOT_DATA_DIR = DATA_DIR;

function startNextServer() {
  if (isDev) return; // dev server is started separately (npm run dev)

  const nextBin = path.join(__dirname, "..", "node_modules", "next", "dist", "bin", "next");
  serverProcess = spawn(process.execPath, [nextBin, "start", "-p", String(PORT)], {
    cwd: path.join(__dirname, ".."),
    env: { ...process.env, LABPILOT_DATA_DIR: DATA_DIR, ELECTRON_RUN_AS_NODE: "1" },
    stdio: "inherit",
  });
  serverProcess.on("error", (e) => console.error("[electron] Next server error:", e));
}

async function createWindow() {
  // Grant camera + microphone so the lab session works.
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(permission === "media" || permission === "mediaKeySystem" || permission === "notifications");
  });

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    title: "LabPilot",
    backgroundColor: "#ffffff",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Open external links in the system browser, not inside the app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(URL)) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  await waitOn({ resources: [`tcp:localhost:${PORT}`], timeout: 60000 });
  await mainWindow.loadURL(URL);
  console.log(`[electron] Window loaded ${URL} (data dir: ${DATA_DIR})`);

  mainWindow.webContents.on("did-finish-load", () => {
    console.log("[electron] Renderer finished loading — LabPilot is ready.");
  });

  mainWindow.on("closed", () => { mainWindow = null; });
}

app.whenReady().then(async () => {
  startNextServer();
  await createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("quit", () => {
  if (serverProcess) {
    try { serverProcess.kill(); } catch { /* ignore */ }
  }
});
