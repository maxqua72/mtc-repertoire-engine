import { defineStore } from 'pinia'
import { watch } from 'vue'
import { useWsClientStore } from './wsClient.js'
import { EngineData, UCIParam } from '../components/EngineData.js'
export const useManagerStore = defineStore("manager", {
    state: () => ({
        //currEngine: null,
        currEngineIdx: null,
        engines: [],
        currStatus: 'off',
        notify: 0,
        infoQueue: [],
        notifyQueue: 0,
        minDepth: 5,
        maxPV: 1
    }),
    getters: {
        currEngine: (state) => state.engines[state.currEngineIdx],
    },
    actions: {
        init(){
            const wsc = useWsClientStore()
            wsc.onMessageHook = this.messageDispatcher
            watch( 
                () => wsc.connected, 
                (newVal, oldVal) => { 
                    /*
                    if (newVal !== oldVal) { 
                        this.metodoDaChiamare(); 
                    } */
                   console.log('Connected: ' + newVal)
                   if(newVal === true){
                       this.getAvailableEngines()
                       this.getCurrentEngine()
                   }
                }
            )
            
        },
        addEngine(engine){
            this.engines.push(engine)
        },
        removeEngine(engine){
            this.engines = this.engines.filter(e => e !== engine)
        },
        
        setCurrEngineByIdx(index){
            this.currEngineIdx = index
            //this.currEngine = this.engines[index]
            const jsondata = JSON.stringify({
                'current-engine': this.currEngineIdx
            })
            window.electron.saveConfigData(jsondata)

            // Start engine if not already started
        },
        getAvailableEngines(){
            const wsc = useWsClientStore()
            wsc.send({msgtype: 'setup.get-available-engines'})
        },
        getCurrentEngine(){
            const wsc = useWsClientStore()
            wsc.send({msgtype: 'setup.get-current-engine'})

        },
        notifyChange(){
            this.notify = (this.notify + 1)%64
        }, 
        notifyQueueChange(){
            this.notifyQueue = (this.notifyQueue + 1)%2048
        }, 
        testEngine(engineData){
            const wsc = useWsClientStore()
            wsc.send({msgtype: 'setup.test-engine', data: engineData})
        },
        bootEngine(engineData){
            const wsc = useWsClientStore()
            wsc.send({msgtype: 'setup.boot-engine', engine: engineData})
        },
        sendUci(ucicmd){
            const wsc = useWsClientStore()
            wsc.send({msgtype: 'uci', ucicmd: ucicmd + "\n"})
        },
        sendOptions(){
            const engine = this.currEngine
            if(engine !== null){
                let options = engine.options
                for(let opt of options){
                    if(opt.name === 'MultiPV'){
                        this.maxPV = parseInt(opt.value)
                    }
                    this.sendUci('setoption name ' + opt.name + ' value ' + opt.value) 
                }
                
            }
        },
        startEval(fen, depth){
            this.currStatus = 'evaluating'
            this.sendOptions()
            this.sendUci("ucinewgame")
            this.sendUci("isready")
            this.sendUci("position fen " + fen)
            this.sendUci("go depth " + depth)
        },
        stopEval(){
            this.sendUci("stop")
        },
        isReady(){
            return this.currStatus === 'ready'
        },
        isEvaluating(){
            return this.currStatus === 'evaluating'
        },
        saveConfig(){
            const jsondata = JSON.stringify({
                engines: this.engines, 
                'current-engine': this.currEngineIdx
            })
            window.electron.saveConfigData(jsondata)
        },
        messageDispatcher(msg){
            console.log('Manager received message: ' + JSON.stringify(msg))
            if(msg.msgtype === 'setup.get-available-engines-ack'){
                this.engines = (msg.data)?msg.data:[]
                console.log('Available engines: ' + JSON.stringify(this.engines))
                this.notifyChange()
            } else if(msg.msgtype === 'setup.get-current-engine-ack'){
                let curr = msg.data
                for(let i = 0; i < this.engines.length; i++){
                    if(this.engines[i].name === curr.name){
                        this.currEngineIdx = i
                        break
                    }
                }
                this.notifyChange()
            } else if(msg.msgtype === 'setup.test-engine-ack'){
                let newEngine = msg.data
                console.log('Engine test result: ' + JSON.stringify(newEngine))
                this.addEngine(new EngineData(newEngine))
                this.currEngineIdx = this.engines.length - 1
                //this.currEngine = this.engines[this.engines.length - 1]
                // save configuration
                this.saveConfig()

                // notify change
                this.notifyChange()
            } else if(msg.msgtype === 'setup.boot-engine-ack'){
                console.log('Engine test started ')
                this.sendUci("uci")
            } else if(msg.msgtype === 'uci.ack'){
                let data = msg.data
                if(data === 'uciok'){
                    this.sendUci("isready")
                } else if(data === 'readyok'){
                    console.log('Engine ready ')
                    if(this.currStatus !== 'evaluating'){
                        this.currStatus = 'ready'
                    }
                } else if(data.startsWith('bestmove')){
                    console.log('Engine ready ')
                    this.currStatus = 'ready'
                } else if(data.startsWith('info depth')){
                    let infodepth = this.parseUciInfoDepth(data)

                    if(infodepth !== null){
                        this.infoQueue.push(infodepth)
                        this.notifyQueueChange()
                    }
                    
                }
                
            }

        },
        parseUciInfoDepth(infoString) {
            const result = { moves: [] }; 
            const tokens = infoString.split(/\s+/); 
            let i = 0; 
            while (i < tokens.length) {
                const key = tokens[i]; 
                switch (key) {
                    //case 'info': 
                    case 'depth': 
                    case 'seldepth': 
                    case 'multipv': 
                    case 'nodes': 
                    case 'nps': 
                    case 'hashfull': 
                    case 'tbhits': 
                    case 'time': // Single-value keys 
                        result[key] = parseInt(tokens[i + 1]); 
                        i += 2; 
                        break; 
                    case 'score':
                        result[key] = {} 
                        i += 1; 
                        break
                    case 'cp': // Score-related keys
                    case 'mate':  // Score-related keys 
                        result['score'] = result['score'] || {}; 
                        result['score'][key] = parseInt(tokens[i + 1]); 
                        result['povEv'] = parseInt(tokens[i + 1]); 
                        i += 2; 
                        break;
                    case 'lowerbound':
                    case 'upperbound':
                        i += 1; 
                        break
                    case 'wdl': // wdl  
                        result['wdl'] = result['score'] || {}; 
                        result['wdl']['win'] = parseInt(tokens[i + 1]); 
                        result['wdl']['draw'] = parseInt(tokens[i + 2]);
                        result['wdl']['loss'] = parseInt(tokens[i + 3]);
                        i += 4; 
                        break; 
                    case 'pv': // Moves (pv) 
                        i++; 
                        
                        while (i < tokens.length && !['info', 'depth', 'seldepth', 'multipv', 'score', 'nodes', 'nps', 'hashfull', 'tbhits', 'time'].includes(tokens[i])) { 
                            result.moves.push(tokens[i]); 
                            i++; 
                        } 
                        result['pv'] = result.moves.join(' ');
                        break; 
                    default: 
                        i++; 
                        break;
                }
            } 

            result['isMate'] = (result.score.mate !== undefined) ? true : false; 

            if(result.score === undefined){
                return null
            } 
            // Sometimes we get #0. Let's just skip it.
            if(result.score.mate !== undefined && result.score.mate === '0'){
                return null
            } 
            
            if(result.score.mate === undefined && result.score.cp === undefined){
                return null
            }
            
            if (result.depth < this.minDepth || 
                (result.nodes === undefined) ||
                (result.time === undefined) || 
                (result.isMate === undefined) || 
                (result.povEv === undefined)) return null;

            
            return result;
        },
        


    }

  
})
