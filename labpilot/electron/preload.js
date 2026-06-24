// Minimal preload. The app runs as a normal web app inside Electron;
// no privileged bridge is needed for this prototype.
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("labpilot", {
  isElectron: true,
  platform: process.platform,
});
