
const ws = new WebSocket('ws://localhost:28080');


ws.onmessage = (event) => {
    const messages = document.getElementById('messages');
    const message = document.createElement('li');
    message.textContent = event.data;
    messages.appendChild(message);
};

ws.onopen = () => {
    console.log("UI connected with wss server")
};

document.getElementById('sendBoot').addEventListener('click', () => {
    const message = {
        msgtype: 'setup',
        cmd: 'start-engine',
        engine: {
            name: 'Stockfish 17',
            path: "C:\\Users\\max\\Documents\\mindthecheck\\engines\\stockfish-17-win-avx2\\",
            file: "stockfish-windows-x86-64-avx2.exe",
            options: []
        }
    }
    //console.log(JSON.stringify(message))
    ws.send(JSON.stringify(message));
});

document.getElementById('sendUci').addEventListener('click', () => {
    const message = {
        msgtype: 'uci',
        ucicmd: 'uci' + '\n',
        engine: {
            name: 'Stockfish 17',
            path: "C:\\Users\\max\\Documents\\mindthecheck\\engines\\stockfish-17-win-avx2\\",
            file: "stockfish-windows-x86-64-avx2.exe",
            options: []
        }
    }

    ws.send(JSON.stringify(message));
});

document.getElementById('sendNewGame').addEventListener('click', () => {
    const message = {
        msgtype: 'uci',
        ucicmd: 'ucinewgame' + '\n',
        engine: {
            name: 'Stockfish 17',
            path: "C:\\Users\\max\\Documents\\mindthecheck\\engines\\stockfish-17-win-avx2\\",
            file: "stockfish-windows-x86-64-avx2.exe",
            options: []
        }
    }
    ws.send(JSON.stringify(message));
});

document.getElementById('sendPosition').addEventListener('click', () => {
    const fen = document.getElementById('fen');
    const message = {
        msgtype: 'uci',
        ucicmd: 'position fen ' + fen.value + '\n',
        engine: {
            name: 'Stockfish 17',
            path: "C:\\Users\\max\\Documents\\mindthecheck\\engines\\stockfish-17-win-avx2\\",
            file: "stockfish-windows-x86-64-avx2.exe",
            options: []
        }
    }
    ws.send(JSON.stringify(message));
    fen.value = ''; // Clear the input field after sending
});

document.getElementById('sendGo').addEventListener('click', () => {
    const depth = document.getElementById('depth');
    const message = {
        msgtype: 'uci',
        ucicmd: 'go depth ' + depth.value + '\n',
        engine: {
            name: 'Stockfish 17',
            path: "C:\\Users\\max\\Documents\\mindthecheck\\engines\\stockfish-17-win-avx2\\",
            file: "stockfish-windows-x86-64-avx2.exe",
            options: []
        }
    }
    ws.send(JSON.stringify(message));
    depth.value = ''; // Clear the input field after sending
});



/*

ipcRenderer.on('server-message', (event, message) => {
    if (message.type === 'todos') {
        //updateTodoList(message.todos);
    }
});
*/
/*
function addTodo() {
  const todo = { id: Date.now(), text: document.getElementById('todo-input').value };
  ws.send(JSON.stringify({ type: 'add-todo', todo }));
}

function removeTodo(id) {
  ws.send(JSON.stringify({ type: 'remove-todo', id }));
}
*/


//document.getElementById('add-todo-button').onclick = addTodo;

/*
// Gestione della configurazione
function updateConfig(newConfig) {
    ipcRenderer.send('update-config', newConfig);
}
    */