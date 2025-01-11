//import dotenv from 'dotenv';
import { app, BrowserWindow , ipcMain, dialog } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { fork } from 'child_process'
import Store from 'electron-store'
import { fileURLToPath } from 'url'
import fs from 'fs'

// load environmental variables
//dotenv.config()

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory


const isDev = process.env.NODE_ENV === 'development'; 
let MAIN_WINDOW_VITE_DEV_SERVER_URL = undefined
if(isDev)
  MAIN_WINDOW_VITE_DEV_SERVER_URL = process.env.MAIN_WINDOW_VITE_DEV_SERVER_URL || 'http://localhost:5174'

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const store = new Store();

console.log("Store path: " + store.path)

const gotTheLock = app.requestSingleInstanceLock(); 
if (!gotTheLock) { 
  console.log('Lock found ' + process.env.IS_SERVER_PROCESS)
  app.quit(); 
} else { 
  if (process.env.IS_SERVER_PROCESS !== 'true') {
    console.log('Processo padre')
  } else {
    console.log('Processo figlio')
  }
  app.on('second-instance', 
    (event, commandLine, workingDirectory) => { 
      // Qui puoi gestire cosa succede quando una seconda istanza viene avviata 
      // Ad esempio, puoi far sì che la finestra principale si mostri in primo piano 
      if (mainWindow) { 
        if (mainWindow.isMinimized()) 
          mainWindow.restore(); 
        mainWindow.focus(); 
      } 
    });
  }

let ce = store.get('current-engine')
if(ce === undefined){
    store.set('current-engine', 0);
    console.log('current-engine not found. set the default (first in the list)');
} else {
    console.log('current-engine found: ' + ce);
}

// Start server first
let mainWindow; 

let server; 
// Funzione per avviare il server e restituire una Promise 
const startServer = () => { 
  return new Promise((resolve, reject) => { 
    console.log('Creating server...' + path.join(__dirname, 'server.js'))

    const serverPath = path.join(__dirname, 'server.js'); 
    console.log('Creating server...', serverPath); 
    if (!fs.existsSync(serverPath)) {
      console.error('Server file not found:', serverPath); 
      reject(new Error('Server file not found')); 
      return;
    }

    server = fork(path.join(__dirname, 'server.js'),[],
                                      { env: {
                                        ...process.env,
                                        CONFIG:  JSON.stringify(store.store),
                                        IS_SERVER_PROCESS: 'true'
                                        },
                                        stdio:'inherit'})
    console.log('fork executed...' + JSON.stringify(server))
    // IPC server --> main
    server.on('message',(message) =>{
      //const message = JSON.parse(msg)
      if(message.type === 'server-up'){
        console.log('Server is up.')
        resolve()
      } else if (message.type === 'get-config-value') {
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

    server.on('error', (error) => { 
      reject(error); 
    });
  })
}


const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 650,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      //contextIsolation: false
    },
  });

  if(process.env.MAIN_WINDOW_VITE_NAME === undefined){
    process.env.MAIN_WINDOW_VITE_NAME = 'main_window'
  }

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    console.log('MAIN_WINDOW_VITE_DEV_SERVER_URL: ' + MAIN_WINDOW_VITE_DEV_SERVER_URL)
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    console.log('MAIN_WINDOW_VITE_NAME:' + process.env.MAIN_WINDOW_VITE_NAME)
    mainWindow.loadFile(path.join(__dirname, '../renderer/' + process.env.MAIN_WINDOW_VITE_NAME + '/index.html'));
    //mainWindow.loadFile(path.join(__dirname, `../renderer/index.html`));
  }

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();
};

// Server
//let server



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

//console.log('Creating server...' + path.join(__dirname, 'server.js'))

/*
server = fork(path.join(__dirname, 'server.js'),[],
                                      { env: {
                                        ...process.env,
                                        CONFIG:  JSON.stringify(store.store),
                                      },})

*/
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  console.log('App is ready...')
  //createWindow();
  try{
    await startServer(); 
    console.log('Server is ready, creating window...'); 
    createWindow();
  } catch (error) { 
    console.error('Failed to start server:', error); 
    app.quit(); 
  }

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      console.log('Re-creating window...')
      createWindow();
    }
  });

  /*
  // IPC server --> main
  server.on('message',(message) =>{
    //const message = JSON.parse(msg)
    if(message.type === 'server-up'){
      console.log('Server is up...Creating window...')
      createWindow();
    } else if (message.type === 'get-config-value') {
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
    */
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
