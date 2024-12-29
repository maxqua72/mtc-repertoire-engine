import { WebSocketServer, WebSocket } from 'ws';
import { spawn } from 'child_process';
import path from 'path';
import { v4 as uuidv4 } from 'uuid'
//import store from './config.js';

const config = JSON.parse(process.env.CONFIG);


const PORT = 28080
const wss = new WebSocketServer({ port: PORT });

let engineInfo = null; //config.engines[config['current-engine']]
let engine = null
//console.log(JSON.stringify(store.store))

const setupBootEngine = function (currengine, ws) {
  engine = spawn(path.normalize(currengine.path + currengine.file));
  engine.stdout.on('data', (data) => {
    console.log(data.toString());
  })
  engine.stderr.on('data', (data) => { });
  engine.on('close', (code) => {
    console.log(`Process exited with code ${code}`);
  });
}



const setupStartEngine = async function (currengine, ws) {
  
  if(engine === null){
    
    console.log(`Process spawning...` + ws.clientId);
    engine = spawn(currengine.path);

    engine.stdout.on('data', (data) => {
      
      if (data.toString()) {
        let lines = data.toString().split(/\r?\n|\r|\n/g);
        
        if (ws) {
          console.log(`Process messaging...` + ws.clientId);
          for (let line of lines) {
            if(line){
              console.log('<--- : ' + line); 
              ws.send(JSON.stringify({msgtype:'uci.ack', data:line}));
            } 
            
          }
        }

      }
    })
    
    engine.stderr.on('data', (data) => { });

    engine.stdin.on('error', (err) => {
      if (err.code === 'EPIPE') {
        console.error('Errore: write EPIPE');
      }
    });
    
    engine.on('spawn', () => {
      console.log(`Process spawned ok`);
      // ack the boot was ok
      console.log('sending setup.boot-engine-ack')
      ws.send(JSON.stringify({msgtype:'setup.boot-engine-ack'}))
      
    });

    engine.on('close', (code) => {
      console.log(`Process exited with code ${code}` + ws.clientId);
      engine = null
    });
    

  } else {
    //engine.stdin.write('quit\n');
    await closeEngine()
    
    setupStartEngine(currengine, ws)
  }
}

function closeEngine() { 
  return new Promise((resolve) => { 
    engine.stdin.write('quit\n')
    engine.once('close', () => { resolve() }) 
  }) 
}

/**
 * Execute the engine boot to catch engine info
 */
const setupTestEngine = async function (currengine, ws, oncompleted) {
  if(engine === null){
    console.log(`setupTestEngine: ` + currengine);
    console.log(`Process spawning...` + ws.clientId);
    engine = spawn(currengine.path);
    let engineData = {
      path: currengine.path, 
      file: currengine.file, 
      name: '', 
      default: []
    }
    engine.stdout.on('data', (data) => {
      
      if (data.toString()) {
        let lines = data.toString().split(/\r?\n|\r|\n/g);
        
        if (ws) {
          console.log(`Process messaging...` + ws.clientId);
          for (let line of lines) {
            if(line){
              console.log('<--- : ' + line); 
              const parts = line.trim().split(/\s+/g);

              if (parts[0] === 'uciok') {
                // return data and close
                oncompleted(engineData)
                engine.stdin.write('quit\n');

              } else if (parts[0] === 'id' && parts[1] === 'name') {
                // capture engine name
                engineData.name = parts.slice(2).join(' ')

              } else if (parts[0] === 'option') {
                // capture option 
                let option = "option name ([\\w\\s]+) type ([\\w]+) default ([^\\s]*)(?: min ([\\w]*) max ([\\w]*))?" + "(?: (var .*))?" // + "(?: var ([^\s]*))*";
                const match = line.match(option);
                if (match) {
                  //console.log("--->" + match[1] + " " + match[3])
                  let def = match[3]
                  if(match[2] === 'spin') def = Number(def)
                  else if(match[2] === 'check') def = (def === 'true')
                  let defopt = { 
                    name: match[1], 
                    type: match[2], 
                    default: def, 
                    min: match[4], 
                    max: match[5] 
                  }
                  /*
                  if (match[2] === 'combo') { 
                    console.log(' match[6] = ' + match[6])
                    const vars = []; 
                    for (let i = 6; i < match.length; i++) { 
                      if (match[i] !== undefined) { 
                        vars.push(match[i]); 
                      } 
                    } 
                    defopt.vars = vars;
                  }*/
                  if (match[2] === 'combo' && match[6]) { 
                    const vars = match[6].match(/var ([^\s]+)/g).map(v => v.replace('var ', '')); 
                    defopt.vars = vars;
                  }
                  engineData.default.push(defopt)
                }
                //this.engineName = parts.slice(2).join(' ');
              }else {

              }
              //ws.send(JSON.stringify({msgtype:'uci.ack', data:line}));
            } 
            
          }
        }

      }
    })
    
    engine.stderr.on('data', (data) => { });

    engine.stdin.on('error', (err) => {
      if (err.code === 'EPIPE') {
        console.error('Errore: write EPIPE');
      }
    });
    
    engine.on('spawn', () => {
      console.log(`Process spawned ok`);
      // ack the boot was ok
      //console.log('sending setup.boot-engine-ack')
      //ws.send(JSON.stringify({msgtype:'setup.boot-engine-ack'}))
      engine.stdin.write('uci\n');
    });

    engine.on('close', (code) => {
      console.log(`Process exited with code ${code}` + ws.clientId);
      engine = null
    });
    

  } else {
    //engine.stdin.write('quit\n');
    await closeEngine()
    
    setupTestEngine(currengine, ws, oncompleted)
  }
}

/**
 * Returns the list of available engines
 */
const setupGetAvailableEngines = function(ws) {
  process.send({ type: 'get-available-engines', clientId:ws.clientId})

}

const setupGetCurrentEngine = function(ws) {
  process.send({ type: 'get-current-engine', clientId:ws.clientId})

}

process.on('message', (message) => {
  if (message.type === 'config-value') {
    console.log(`Valore ricevuto: ${message.key} = ${message.value}`);
    config[message.key] = message.value
  } else if (message.type === 'config') {
    config = message.value
  } else if(message.type === 'get-available-engines-ack'){
    console.log('=== <=== ' + message.type + '/' + message.clientId)
    const clientsArray = Array.from(wss.clients);
    
    const client = clientsArray.find(client => client.clientId === message.clientId);
    
    if (client && client.readyState === WebSocket.OPEN) {
      //console.log('client ' + JSON.stringify(client) + ' state: ' + client.readyState)
      client.send(JSON.stringify({ msgtype: 'setup.get-available-engines-ack', data: message.engines }));
    }
      
     for(let client of clientsArray){
      console.log('client: ' + client.clientId + " === " + message.clientId)
      if (client && client.readyState === WebSocket.OPEN) {
        //console.log('client ' + JSON.stringify(client) + ' state: ' + client.readyState)
        //client.send(JSON.stringify({ msgtype: 'setup.get-available-engines-ack', data: message.engines }));
      }
     }
  } else if(message.type === 'get-current-engine-ack'){
    console.log('=== <=== ' + message.type + '/' + message.clientId)
    const clientsArray = Array.from(wss.clients);
    const client = clientsArray.find(client => client.clientId === message.clientId);
    
    if (client && client.readyState === WebSocket.OPEN) {
      //console.log('client ' + JSON.stringify(client) + ' state: ' + client.readyState)
      client.send(JSON.stringify({ msgtype: 'setup.get-current-engine-ack', data: message.engine }));
    }
  }
});

wss.on('connection', (ws) => {
  ws.clientId = uuidv4()

  console.log('Client connected ' + ws.clientId);
  //console.log('ws client ' + JSON.stringify(ws) + ' state: ' + ws.readyState)
  
  //ws.send('connected to WebSocket!');
  ws.send(JSON.stringify({msgtype:'setup.connected'}))

  ws.on('close', () => {
    console.log('Client disconnected '+ ws.clientId);
  });

  ws.on('message', (msg) => {
    
    console.log('Received: ' + msg + ' from ' + ws.clientId);
    let message = JSON.parse(msg)
    //ws.send(`Echo: ${msg}`);

    if (message == 'start') {

      //engine = spawn(path.normalize('C:\\Users\\max\\Documents\\mindthecheck\\engines\\stockfish-17-win-avx2\\stockfish-windows-x86-64-avx2.exe'));
      engine = spawn(path.normalize(engineInfo.path + engineInfo.file));
      console.log(engineInfo.name + ' started ')
      // Leggi l'output del processo da stdout
      engine.stdout.on('data', (data) => {
        console.log('data from engine: (' + typeof (data) + ') ' + data);
        
        let infodepth = "info depth ([\\w]*) seldepth [\\w]* multipv ([\\w]*) score (cp ([\\-\\w]*)|mate ([\\w*])) [\\s\\w]*pv ([\\w]*)\\s*([\\s\\w]*)";
        let option = "option name ([\\w]*) type ([\\w]*) default ([^\\s]*)(?: min ([\\w]*) max ([\\w]*))?";

        if (data.toString()) {
          let lines = data.toString().split(/\r?\n|\r|\n/g);
          let defoptions = []
          let tosaveoptions = false
          for (let line of lines) {
            if (line.startsWith('option') && engineInfo.default) {

              const match = line.match(option);
              if (match) {
                //console.log("--->" + match[1] + " " + match[3])
                let defopt = { name: match[1], type: match[2], default: match[3], min: match[4], max: match[5] }
                defoptions.push(defopt)
                engineInfo.default = defoptions
                tosaveoptions = true
              }

            }
            ws.send(`Echo: ${line}`);
          }
          if (tosaveoptions) {
            process.send({ type: 'set-config-engine', key: 'default', value: engineInfo.default, index: config['current-engine'] })
          }
        }

      });

      // Gestisci eventuali errori
      engine.stderr.on('data', (data) => {
        //ws.send(`Error: ${data.toString()}`);
        console.log(`Error: ${data.toString()}`);
      });

      // Invia i dati al processo tramite stdin
      //engine.stdin.write("uci");
      //engine.stdin.end();

      engine.stdin.write('uci\n');
      //engine.stdin.write('position fen rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2\n');
      //engine.stdin.write('go\n');

      engine.on('close', (code) => {
        //ws.send(`Process exited with code ${code}`);
        console.log(`Process exited with code ${code}`);
      });
      
      

    } else if (message.msgtype === 'setup' && message.cmd === 'start-engine') {
      console.log('---> setup: start-engine');
      setupStartEngine(message.engine, ws)

    } else if(message.msgtype === 'setup.get-available-engines'){
      console.log('===> setup: get-available-engines');
      setupGetAvailableEngines(ws)

    } else if(message.msgtype === 'setup.get-current-engine'){
      console.log('===> setup: get-current-engine');
      setupGetCurrentEngine(ws)

    } else if (message.msgtype === 'setup.boot-engine') {
      console.log('---> setup: boot-engine ' + ws.clientId);
      setupStartEngine(message.engine, ws)

    } else if (message.msgtype === 'setup.test-engine') {
      console.log('---> setup: test-engine ' + ws.clientId);
      setupTestEngine(message.data, ws, function(data){
        ws.send(JSON.stringify({msgtype:'setup.test-engine-ack', data:data}))
      })

    } else if (message.msgtype === 'uci') {
      console.log('---> uci: ' + message.ucicmd);
      try{
        engine.stdin.write(message.ucicmd);
      } catch(e){}
      

    }

  });

});

console.log('WebSocket server is running on ws://localhost:' + PORT);