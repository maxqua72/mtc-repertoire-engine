import { app, BrowserWindow, ipcMain } from 'electron'
import { fork } from 'child_process'
import Store from 'electron-store'
import path from 'path'
import { fileURLToPath } from 'url'

// useful to use __dirname
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

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
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, '../renderer/preload.js'),
    },
  })

  //win.loadFile('src/renderer/index.html')
  win.loadFile(path.join(__dirname, '../renderer/index.html'))
}

let server 
    
app.on('window-all-closed', () => {
    if (server) {
        server.kill(); // Termina il processo del server WebSocket
      }
    if (process.platform !== 'darwin') app.quit()
})

server = fork(path.join(__dirname, 'server.js'),[],
                                      { env: {
                                        ...process.env,
                                        CONFIG:  JSON.stringify(store.store),
                                      },})

app.whenReady().then(() => {
  createWindow()
/*
  server = utilityProcess.fork(path.join(__dirname, 'server.js'))
  */
 /*
  server = fork(path.join(__dirname, 'server.js'),[],
                                      { env: {
                                        ...process.env,
                                        CONFIG:  JSON.stringify(store.store),
                                      },})
*/
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })


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
      if(engines.length > message.index){
        engines[message.index][message.key] = message.value
      }
      store.set('engines', engines);
      //server.send({ type: 'config-value', key: message.key, value: message.value });
    } else if (message.type === 'get-config') {
      const config = store.store;
      server.send({ type: 'config', store: config });
    }
  })

  // IPC main --> server
  /*
  let engines = store.get('engines')
  if(engines !== undefined && engines.length > 0){
    let currengine = engines[ce]
    let toserver = {  msgtype: 'setup', 
                      cmd: 'start-engine',
                      engine: {name: currengine.name, path: currengine.path, file: currengine.file, options: currengine.options}
                    }
    server.send(toserver)
  }
    */
  
  
  

})