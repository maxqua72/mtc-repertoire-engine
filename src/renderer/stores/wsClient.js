import { defineStore } from 'pinia'
export const useWsClientStore = defineStore("wsClient", {
    state: () => ({
        wsc: null,
        connected: false,
        onMessageHook: function(msg){}
    }),
    getters: {
        wsclient: (state) => state.wsc,
    },
    actions: {
        init(){
            const ws = new WebSocket('ws://localhost:28080?client-type=internal');
            this.connected = false
            ws.onopen = () => {
                console.log("UI Client connected with wss server")
                this.connected = true
            };
            ws.onmessage = (message) => {
                console.log("Received: '" + message.data + "'");
                this.onMessageHook(JSON.parse(message.data))
            };
            ws.onclose = () => {
                console.log('UI Client Disconnected');
                this.connected = false
            };
            this.wsc = ws
        },
        send(message){
            this.wsc.send(JSON.stringify(message));
        }

        
    }

  
})
