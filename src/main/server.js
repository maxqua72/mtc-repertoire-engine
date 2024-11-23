import { WebSocketServer, WebSocket } from 'ws';
import { spawn } from 'child_process';
import path from 'path';
import { v4 as uuidv4 } from 'uuid'
//import store from './config.js';

const config = JSON.parse(process.env.CONFIG);


const PORT = 28080
const wss = new WebSocketServer({ port: PORT });

let engineInfo = config.engines[config['current-engine']]
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



const setupStartEngine = function (currengine, ws) {
  engine = spawn(path.normalize(currengine.path + currengine.file));
  engine.stdout.on('data', (data) => {
    
    if (data.toString()) {
      let lines = data.toString().split(/\r?\n|\r|\n/g);
      
      if (ws) {
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
  engine.on('close', (code) => {
    console.log(`Process exited with code ${code}`);
  });
}

/**
 * Execute the engine boot to catch engine info
 */
const setupInfoEngine = function () {

}

/**
 * Returns the list of available engines
 */
const setupGetAvailableEngines = function(ws) {
  process.send({ type: 'get-available-engines', clientId:ws.clientId})

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
  }
});

wss.on('connection', (ws) => {
  console.log('Client connected');
  console.log('ws client ' + JSON.stringify(ws) + ' state: ' + ws.readyState)
  ws.clientId = uuidv4()
  ws.send('connected to WebSocket!');

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('message', (msg) => {
    
    console.log('Received: ' + msg);
    let message = JSON.parse(msg)
    //ws.send(`Echo: ${msg}`);

    if (message == 'start') {

      //engine = spawn(path.normalize('C:\\Users\\max\\Documents\\mindthecheck\\engines\\stockfish-17-win-avx2\\stockfish-windows-x86-64-avx2.exe'));
      engine = spawn(path.normalize(engineInfo.path + engineInfo.file));
      console.log(engineInfo.name + ' started ')
      // Leggi l'output del processo da stdout
      engine.stdout.on('data', (data) => {
        console.log('data from engine: (' + typeof (data) + ') ' + data);
        /*
                for (var property in data) {
                  console.log(property + ': ' + data[property]+'; ');
                }
        */
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

    } else if (message.msgtype === 'uci') {
      console.log('---> uci: ' + message.ucicmd);
      engine.stdin.write(message.ucicmd);

    }

  });

});

console.log('WebSocket server is running on ws://localhost:' + PORT);