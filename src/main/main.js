import 'dotenv/config';
import { app, BrowserWindow , ipcMain, dialog } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { fork } from 'child_process'
import Store from 'electron-store'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const store = new Store();

console.log("Store path: " + store.path)

let ce = store.get('current-engine')
if(ce === undefined){
    store.set('current-engine', 0);
    console.log('current-engine not found. set the default (first in the list)');
} else {
    console.log('current-engine found: ' + ce);
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 650,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  
  console.log('../renderer/' + process.env.MAIN_WINDOW_VITE_NAME + '/index.html')
  //console.log(`../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
  console.log(`${process.env.MAIN_WINDOW_VITE_DEV_SERVER_URL}/index.html`)
  console.log(__dirname)
  console.log(__filename)
  // and load the index.html of the app.
  if (process.env.MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../${process.env.MAIN_WINDOW_VITE_NAME}/index.html`));
    //mainWindow.loadFile(path.join(__dirname, `../renderer/index.html`));
  }

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();
};

// Server
let server



// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (server) {
    server.kill(); // Termina il processo del server WebSocket
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

server = fork(path.join(__dirname, 'server.js'),[],
                                      { env: {
                                        ...process.env,
                                        CONFIG:  JSON.stringify(store.store),
                                      },})


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // IPC server --> main
  server.on('message',(message) =>{
    //const message = JSON.parse(msg)
    if (message.type === 'get-config-value') {
      const value = store.get(message.key);
      server.send({ type: 'config-value', key: message.key, value });

    } else if (message.type === 'set-config-value') {
      store.set(message.key, message.value);
      server.send({ type: 'config-value', key: message.key, value: message.value });

    }  else if (message.type === 'set-config-engine') {
      let engines = store.get('engines')
      if(engines && engines.length > message.index){
        engines[message.index][message.key] = message.value
      }
      store.set('engines', engines);
      //server.send({ type: 'config-value', key: message.key, value: message.value });

    } else if (message.type === 'get-config') {
      const config = store.store;
      server.send({ type: 'config', store: config });

    } else if (message.type === 'get-available-engines') {
      console.log('=== ===> ' + message.type + '/' + message.clientId)
      let availableEngines = store.get('engines')
      server.send({ type: 'get-available-engines-ack', engines: availableEngines , clientId: message.clientId});

    } else if (message.type === 'get-current-engine') {
      console.log('=== ===> ' + message.type + '/' + message.clientId)
      let engines = store.get('engines')
      let idx = store.get('current-engine')
      if(engines && engines.length > idx){
        let current = engines[idx]
        server.send({ type: 'get-current-engine-ack', engine: current , clientId: message.clientId});
      }
      
    }
  })
});
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
// Listen for the get-file-path event from the renderer process
ipcMain.handle('open-file-dialog', 
    async () => { 
      const result = await dialog.showOpenDialog({ 
        properties: ['openFile'], 
        filters: [{ 
          name: 'All Files', 
          extensions: ['*'] 
        }], 
      }); 
      if (result.canceled) { return null } 
      else { 
        const filePath = result.filePaths[0]; 
        // Restituisce il percorso del file selezionato 
        if(!filePath) return null
        return { 
          path: path.normalize(filePath), 
          name: path.basename(filePath)
        }
      }
    }
)
ipcMain.handle('save-config-data', (event,data) => {
  if(data) {
    const configData = JSON.parse(data)
    store.set(configData);
  }
})
