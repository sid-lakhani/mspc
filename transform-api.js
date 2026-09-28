const fs = require('fs');
let code = fs.readFileSync('src/preload/index.ts', 'utf8');

// Remove electron import
code = code.replace(/import \{.*?\} from 'electron';\n/, '');

// Add callBackend and subscribeBackend definitions at the top
code = `import { callBackend, subscribeBackend, callBackendSync } from './backend';\n` + code;

// Replace ipcRenderer.invoke(...) with callBackend(...)
// Use regex to replace ipcRenderer.invoke with callBackend
code = code.replace(/ipcRenderer\.invoke/g, 'callBackend');

// Replace ipcRenderer.on with subscribeBackend
code = code.replace(/ipcRenderer\.on/g, 'subscribeBackend');

// Replace ipcRenderer.removeListener with unsubscribeBackend
code = code.replace(/ipcRenderer\.removeListener/g, 'unsubscribeBackend');

// Replace ipcRenderer.sendSync with callBackendSync
code = code.replace(/ipcRenderer\.sendSync/g, 'callBackendSync');

// Remove contextBridge.exposeInMainWorld(...)
code = code.replace(/contextBridge\.exposeInMainWorld[\s\S]*?;/, '');

// Export api as default or named
code = code.replace(/const api = \{/, 'export const api = {');

// Remove the `export type CthApi = typeof api;` if it exists, or change it
// Well, we can leave export type CthApi.
fs.writeFileSync('src/renderer/src/api.ts', code);
