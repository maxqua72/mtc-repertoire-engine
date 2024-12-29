<script>
import { Chess } from 'chess.js'
import * as util from './MoveUtils.js'
//import { tnid, fen2pid} from './Utils.js'
//import MoveEvent from '../MoveEvent.js'
import { usePositionStore } from '../stores/position.js'

export default {
    name: 'PgnLine',
    components: {
    },
    data() {
        return {
            showAll: false,
            //lastEventFromExplorer
        }
    },
    props: {
        uciLine: {
            type: Object
        },
        fen: {
            type: String
        },
    },
    setup() {
        const pos = usePositionStore()
        return { pos }
    },
    
    watch: {
        uciLine(){
            console.log('uciline changed: ' + JSON.stringify(this.uciLine))
        }
    },
    computed: {

        sanList() {
            let fen = this.fen
            let uciLine = this.uciLine
            if (fen && uciLine) {
                if (uciLine.moves) {
                    let chess = new Chess(fen)
                    let fenarray = fen.split(" ")
                    let color = fenarray[1]
                    let fmvn = fenarray[5]
                    let ucilist = uciLine.moves.split(" ")
                    //console.log('uciline: ' + JSON.stringify(ucilist))
                    let list = []
                    for (const uci of ucilist) {
                        
                        try{
                            //console.log('+sanList ' + fen + '/' + chess.fen() + '@' + uci)
                            chess.move(util.uci2move(uci))
                        } catch(err){
                            // potrebbe essere un arrocco non standard
                            //console.log('-sanList ' + fen + '/' + chess.fen() + '@' + uci)
                            try{
                                chess.move(util.uci2moveFallback(uci))
                            } catch(err){
                                console.error('errore ' + err)
                                // invalida la uciline perchè incompatibile con il fen
                                break
                            }
                            
                        }
                        let history = chess.history()
                        let elem = {
                            uci: uci,
                            san: history[history.length - 1],
                            fen: chess.fen(),
                            color: color,
                            fmvn: fmvn
                        }
                        list.push(elem)
                        fenarray = chess.fen().split(" ")
                        color = fenarray[1]
                        fmvn = fenarray[5]
                    }
                    return list
                }

            }
            return []

        }
    },
    methods:{
        toggleShowAll(){
            this.showAll = !this.showAll
        },
        onclick(san){
            // Carica il fen in chess e la mossa selezionata
            // determina il fen 
            // invia il fen al tree
            if(this.fen){
                let chess = new Chess(this.fen)
                chess.move(san)
                let newfen = chess.fen()
                let history = chess.history({ verbose: true })
                let last = history[history.length - 1]
                this.pos.fen = newfen
                this.pos.notifyChange()
            }
            

        },
        onclickForward(idx){
            // Carica il fen in chess e la mossa selezionata
            // determina il fen 
            // invia il fen al tree
            let uciLine = this.uciLine
            if(this.fen && uciLine){
                let ucilist = uciLine.moves.split(" ")
                let newfen = this.fen
                for(let i = 0; i <= Math.min(idx,ucilist.length - 1); i++){
                    let mv = ucilist[i]
                    let chess = new Chess(newfen)
                    chess.move(mv)
                    newfen = chess.fen()
                    let history = chess.history({ verbose: true })
                    let last = history[history.length - 1]
                }
                this.pos.fen = newfen
                this.pos.notifyChange()
                
            }
            

        }
    }
}
</script>

<template>
    <div class="pgn-line-container text-truncate" :class="{'show-all':showAll}">
        <span class="fw-bold pgn-toggle" @click="toggleShowAll">
            <i class="fa-solid fa-caret-down" v-if="!showAll"></i>
            <i class="fa-solid fa-caret-up" v-if="showAll"></i>
        </span>
        <span v-for="(elem, index) in sanList" :key="elem.fen" style="display: inline-block;" class="text-truncate">
            
            <span v-if="index === 0" class="fw-bold pgn-score">{{ uciLine.score }}</span>
            <span v-if="elem.color === 'w'">
                {{ elem.fmvn }}.
            </span>
            <span v-if="index === 0 && elem.color === 'b'">{{ elem.fmvn }}...</span>
            
            <span class="pgn-move text-truncate fw-bold mvlnk" v-if="index === 0" @click="onclick(elem.san)">{{ elem.san }}</span>
            <span class="pgn-move text-truncate mvlnk" v-if="index > 0"  @click="onclickForward(index)">{{ elem.san }}</span>
        </span>
    </div>
</template>

<style>
.pgn-score {
    margin-right: 8px;
    color: green
}

.pgn-move {
    margin-right: 4px;
    font-family: chess
}

.pgn-line-container {
    /*height: 1.6rem;*/
    white-space: nowrap;
    overflow: hidden;
    border-bottom: 1px solid lightgray;
    font-size:0.8rem;
    position:relative;
    line-height:1.1rem
}
.show-all{
    white-space:normal !important
}

.pgn-toggle {
    position:absolute;
    top:0;
    right:0;
    padding: 0 4px;
    margin: 0;
    cursor: pointer;
}

.mvlnk {
    cursor: pointer;
}
.mvlnk:hover {
    background-color:#FFD580;
}
</style>