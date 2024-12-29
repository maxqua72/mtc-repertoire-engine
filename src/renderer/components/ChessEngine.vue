<script>

//import STOCKFISH from 'stockfish.js';
//import StockfishWorker from './StockfishWorker.js';
//import { treeModelStore as tms1 } from '../../stores/treeModel.js'
//import { useModelStore} from "../../stores/model"
//import { cursorStore } from '../../stores/cursor.js'
//import { autoShapesStore } from '../../stores/autoShapes.js'
//import { store } from '../../stores/store.js'
//import { eventFromToolbarStore } from '../../stores/eventFromToolbar.js'
//import { optionsStore } from '../../stores/sideColor.js'
//import { jsonModelStore } from '../../stores/jsonModel.js'
//import { currentLineStore } from '../../stores/currentLine.js'
//import { searchStore } from '../../stores/search.js'
import { povDiff, colorFromFen, toPov, renderEval, uci2move, assessMove } from './MoveUtils.js'
import PgnLine from './PgnLine.vue'
//import * as layout from './LayoutUtils.js'

//import { useEngineMgrStore} from "../../stores/engineMgr"


export default {
    name: 'ChessEngine',
    components: {
        PgnLine
    },
    setup() {
        /*
        const tms = useModelStore()
        const emgr = useEngineMgrStore()
        return { tms, emgr }
        */
    },
    data() {
        return {
            /*
            cursorStore,
            autoShapesStore,
            store,
            eventFromToolbarStore,
            optionsStore,
            jsonModelStore,
            currentLineStore,
            searchStore,*/
            engineQueue:new Set() // lista di id su cui effettuare l'analisi del computer
        }
    },
    watch: {
        /*
        'currentLineStore.runEvalCurrentLine'(){
            this.evalCurrentLine()
        },
        'currentLineStore.runStatsCurrentLine'(){
            this.statsCurrentLine()
        },
        'cursorStore.node'() {
            // cambia la posizione selezionata.
            // 1. verifico se ci sono le statistiche, se non ci sono le carico da lichess
            // 2. attivo l'engine se non c'è un risultato ottenuto da lichess oppure se una
            // valutazione precedente non è stata completata
            let cnode = this.cursorStore.node
            console.log("-----> Processing id=" + cnode.id)
            // 1. statistiche
            let statsToFetch = false
            if (cnode.content.stats.length < 2) {
                //if (!cnode.content.stats['master'] || !cnode.content.stats['lichess']) {
                statsToFetch = true && optionsStore.explorer
            }

            let evalsToFetch = false
            if (!cnode.content.evals['lichess-depth'] && !cnode.content.evals['lichess-not-found']) {
                //evalsToFetch = true && optionsStore.engine 
                evalsToFetch = true && optionsStore.engineLichess
            }

            let evalsToSearch = false
            if (this.cursorStore.node.content.evals['highest-depth']) {
                if (this.cursorStore.node.content.evals['highest-depth'].status !== 'complete') {
                    //evalsToSearch = true && optionsStore.engine
                    evalsToSearch = true && (optionsStore.engineInternal || optionsStore.engineExternal)
                }
            } else {
                //evalsToSearch = true && optionsStore.engine
                evalsToSearch = true && (optionsStore.engineInternal || optionsStore.engineExternal)
            }

            if (statsToFetch || evalsToFetch || evalsToSearch) {
                cnode.content.updating = true
                console.log("!!!!!!! UPDATING = TRUE")
            }

            if (statsToFetch) {
                this.lichess.fetchStats(this.cursorStore.node.content.fen,
                    (json) => {
                        //cnode.content.addStat('master', json.white, json.draws, json.black)
                        cnode.content.addStat('master', json)
                        this.tms.tree.logUpdate({pid:cnode.pid})
                    },
                    (json) => {
                        //cnode.content.addStat('lichess', json.white, json.draws, json.black)
                        cnode.content.addStat('lichess', json)
                        this.tms.tree.logUpdate({pid:cnode.pid})
                        if(json && json.opening){
                            this.searchStore.notify()
                        }
                    },
                    (error) => {
                    },
                    () => {
                        console.log("<----- Processed id=" + cnode.id)
                        if (!evalsToFetch && !evalsToSearch) {
                            cnode.content.updating = false
                            console.log("!!!!!!! 1 UPDATING = FALSE")
                        }
                    })
            }


            if (!evalsToFetch && !evalsToSearch) {
                this.cursorStore.notifyEvalUpdate()
                this.setAutoShapes(cnode)
                return
            }

            if (evalsToFetch) {
                // Provo a vedere se in lichess esiste una valutazione
                this.lichess.fetchEvals(this.cursorStore.node.content.fen, (json) => {
                    //console.log("fen : "+ this.cursorStore.node.content.fen)
                    if (json.error === undefined) {
                        let node = this.tms.tree.node(this.cursorStore.node.id)
                        let pvs0 = json.pvs[0]
                        node.content.addEval('lichess-depth', json.depth, json.depth, json.knodes, pvs0.cp, pvs0.mate, json.pvs)
                        console.log("Lichess found")
                        this.setAutoShapes(node)
                        this.emgr.engine.stop()
                        this.nodeAssessMove(node)
                        this.cursorStore.notifyEvalUpdate('lichess') // dopo lo stop per evitare corse
                        this.currentLineStore.line = this.tms.tree.currentLine(node.id)
                        this.currentLineStore.notifyChange()
                        this.tms.tree.logUpdate({pid:node.pid})
                        //node.content.updating = false
                    } else if (json.error === 'Not found') {
                        // Su lichess non c'è
                        let node = this.tms.tree.node(this.cursorStore.node.id)
                        node.content.addEval('lichess-not-found')
                        console.log("Lichess NOT found")
                    } else {   
                        //cnode.content.updating = false
                    }
                }, (error) => {
                    //cnode.content.updating = false
                },
                    () => {
                        if (!evalsToSearch) {
                            cnode.content.updating = false
                            console.log("!!!!!!! 2 UPDATING = FALSE")
                        }

                    }
                )
            }
                
            if (this.cursorStore.node.content.evals['highest-depth']) {
                if (this.cursorStore.node.content.evals['highest-depth'].status === 'complete') {
                    console.log(this.cursorStore.node.content.fen + " --> " + this.cursorStore.node.content.evals['highest-depth'].status)
                    this.cursorStore.notifyEvalUpdate()
                    this.setAutoShapes(cnode)
                    return
                }

            }
            //cnode.content.updating = true

            if (evalsToSearch) {
                this.emgr.engine.start({
                    id: this.cursorStore.node.id,
                    fen: cursorStore.node.content.fen,
                    maxDepth: 18,
                    multiPv: 3,
                    moves: [],
                    emit: (o) => {
                        let node = this.tms.tree.node(o.id)
                        if (node) {
                            let ev = node.content.evals['highest-depth']
                            if (ev) {
                                if (ev.status === 'incomplete') {
                                    node.content.addEval('highest-depth', o.maxDepth, o.depth, o.nodes, o.cp, o.mate, o.pvs, this.emgr.name)
                                    
                                    this.cursorStore.notifyEvalUpdate()
                                    this.setAutoShapes(node)
                                    if(node.content.evals['highest-depth'].status === 'complete'){
                                        this.nodeAssessMove(node)
                                        this.currentLineStore.line = this.tms.tree.currentLine(node.id)
                                        this.currentLineStore.notifyChange()
                                    }
                                } else if (ev.status === 'complete') {
                                    node.content.updating = false
                                    this.tms.tree.logUpdate({pid:node.pid})
                                    console.log("!!!!!!! 3 UPDATING = FALSE")
                                    
                                }
                            } else {
                                node.content.addEval('highest-depth', o.maxDepth, o.depth, o.nodes, o.cp, o.mate, o.pvs, this.emgr.name)
                                //this.nodeAssessMove(node)
                                this.cursorStore.notifyEvalUpdate()
                                this.setAutoShapes(node)
                            }

                        } // altrimenti ferma il motore

                    },
                    oncompleted: (id) => {
                        let node = this.tms.tree.node(id)
                        if (node) {
                            node.content.updating = false
                            console.log("!!!!!!! 4 UPDATING = FALSE")
                        } else {
                            console.log("Node no longer available: " + id)
                            // occorre cancellare il task
                        }

                    }
                })
            }
        },
        'eventFromToolbarStore.fired'() {
            this.trace()
        }
            */
    },
    computed: {
        bestscore() {
            let bs = 0
            /*
            let cnode = this.cursorStore.node
            
            if (cnode.content) {
                let c = cnode.content.fen.includes(' w ') ? 'white' : 'black';
                let ev = undefined
                let cp = undefined
                if (cnode.content.evals['lichess-depth'] !== undefined) {
                    ev = cnode.content.evals['lichess-depth']
                    cp = ev.cp
                    //console.log('bestscore lichess: ' + ((ev)?ev.cp:"-") + " eval: " + cp + " color: " + c )
                } else if (cnode.content.evals['highest-depth'] !== undefined) {
                    ev = cnode.content.evals['highest-depth']
                    if (ev.cp) cp = toPov(c, ev.cp)
                    //console.log('bestscore highest: ' + ((ev)?ev.cp:"-") + " eval: " + cp + " color: " + c )
                }
                if (ev) {
                    if (cp !== undefined) {
                        bs = renderEval(cp)
                    } else if (ev.mate !== undefined) {
                        return "#" + ev.mate
                    }
                }


            }
*/
            return bs
        },

        depth() {
            /*
            let cnode = this.cursorStore.node
            if (cnode.content) {
                if (cnode.content.evals['lichess-depth'] !== undefined) {
                    return cnode.content.evals['lichess-depth'].depth
                } else if (cnode.content.evals['highest-depth'] !== undefined) {
                    return cnode.content.evals['highest-depth'].depth
                }
            }
                */
               return 18
        },
        nodes() {
            /*
            let cnode = this.cursorStore.node
            if (cnode.content) {
                if (cnode.content.evals['lichess-depth'] !== undefined) {
                    let nodes = cnode.content.evals['lichess-depth'].nodes
                    let mnodes = Math.round(nodes / 1000000)
                    let knodes = Math.round(nodes / 1000)
                    if (mnodes > 1) return mnodes + "M"
                    if (knodes > 1) return knodes + "K"
                } else if (cnode.content.evals['highest-depth'] !== undefined) {
                    let nodes = cnode.content.evals['highest-depth'].nodes
                    let mnodes = Math.round(nodes / 1000000)
                    let knodes = Math.round(nodes / 1000)
                    if (mnodes > 1) return mnodes + "M"
                    if (knodes > 1) return knodes + "K"
                }
            }
                */
            return "10K"
        },
        source() {
            /*
            let cnode = this.cursorStore.node
            if (cnode.content) {
                if (cnode.content.evals['lichess-depth'] !== undefined) {
                    return 'lichess'
                } else if (cnode.content.evals['highest-depth'] !== undefined) {
                    return 'stockfish'
                }
            }
                */
        },

        sourcename() {
            /*
            let cnode = this.cursorStore.node
            if (cnode.content) {
                if (cnode.content.evals['lichess-depth'] !== undefined) {
                    return 'Lichess cloud'
                } else if (cnode.content.evals['highest-depth'] !== undefined) {
                    let name = cnode.content.evals['highest-depth'].name
                    if(name){
                        return name
                    } else {
                        return 'Stockfish 15 local'
                    }
                    
                }
            }
                */
        },

        updating() {
            /*
            let cnode = this.cursorStore.node
            if (cnode.content) {
                if (cnode.content.updating !== undefined) {
                    return cnode.content.updating
                } else {
                    return false
                }
            }
                */
        },
        currentFen() {
            /*
            let cnode = this.cursorStore.node
            if (cnode.content) {
                return cnode.content.fen
            }
            */
        },
        currentNodeId() {
            /*
            let cnode = this.cursorStore.node
            return cnode.id
            */
        },
        pvs() {
            let pvs = { pvs: [], type: 'noneyet' }
            /*
            let cnode = this.cursorStore.node
            
            if (cnode.content) {
                if (cnode.content.evals['lichess-depth'] !== undefined) {
                    pvs.pvs = cnode.content.evals['lichess-depth'].pvs
                    pvs.type = 'lichess-depth'
                } else if (cnode.content.evals['highest-depth'] !== undefined) {
                    pvs.pvs = cnode.content.evals['highest-depth'].pvs
                    pvs.type = 'highest-depth'
                }
            }
            //console.log('pvs per ' + cnode.content.fen + ' ' + JSON.stringify(pvs.pvs))
            */
            return pvs
        },
    },
    methods: {
        uciCmd(cmd, which) {
            console.log("UCI: " + cmd);
            (which || this.evaler).postMessage(cmd);
        },
        score(color, cp, mate, type) {
            let rcp, bs
            if (type === 'lichess-depth') {
                rcp = cp
            } else if (type === 'highest-depth') {
                if (cp !== undefined) rcp = toPov(color, cp)
            }
            if (rcp !== undefined) {
                bs = renderEval(rcp)
            } else if (mate !== undefined) {
                return "#" + mate
            }
            //console.log("--- " + bs)
            return bs
        },

        nodeAssessMove(n){
            /*
            let parent = this.tms.tree.visibleParent(n.id)
            if(parent){
                let nodePerc = n.content.getEval().perc
                let parentPerc = parent.content.getEval().perc
                let color = colorFromFen(n.content.fen)
                let am = undefined
                if(parentPerc !== undefined && nodePerc !== undefined){
                    am = assessMove(nodePerc, parentPerc, color)
                }
                if(am){
                    n.tagMove = am
                }
            }
                */
        },

        line(pv, type) {
            let line = {}
            /*
            let cnode = this.cursorStore.node
            
            
            if (this.pvs) {
                let c = cnode.content.fen.includes(' w ') ? 'white' : 'black';
                line = {
                    score: this.score(c, pv.cp, pv.mate, type),
                    moves: pv.moves
                }
                if (pv.moves instanceof Array)
                    line.moves = pv.moves.join(' ')
            }
                    */
            return line
        },
        force() {
            /*
            let cnode = this.cursorStore.node
            if (cnode.content) {
                cnode.content.evals['lichess-not-found'] = undefined
                cnode.content.evals['lichess-depth'] = undefined
                cnode.content.evals['highest-depth'] = undefined
            } else {
                return
            }

            cnode.content.evals = {}
            if(optionsStore.engineEnabled()){
                cnode.content.updating = true
            }
            if(optionsStore.engineLichess){
                
                this.lichess.fetchEvals(cnode.content.fen, (json) => {
                    //console.log("fen : "+ this.cursorStore.node.content.fen)
                    if (json.error === undefined) {
                        let pvs0 = json.pvs[0]
                        cnode.content.addEval('lichess-depth', json.depth, json.depth, json.knodes, pvs0.cp, pvs0.mate, json.pvs)
                        console.log("Lichess found")
                        this.nodeAssessMove(cnode)
                        this.cursorStore.notifyEvalUpdate()
                        this.emgr.engine.stop()
                        this.tms.tree.logUpdate({pid:cnode.pid})
                        //node.content.updating = false
                    } else if (json.error === 'Not found') {
                        // Su lichess non c'è
                        cnode.content.addEval('lichess-not-found')
                        console.log("Lichess NOT found")
                    } else {
                        //cnode.content.updating = false
                    }
                }, (error) => {
                    //cnode.content.updating = false
                }, () => {
                })
            }
            
            if(optionsStore.engineInternal || optionsStore.engineExternal){

                this.emgr.engine.start({
                    id: cnode.id,
                    fen: cnode.content.fen,
                    maxDepth: 18,
                    multiPv: 3,
                    moves: [],
                    emit: (o) => {
                        let node = this.tms.tree.node(o.id)
                        if (node) {
                            let ev = node.content.evals['highest-depth']
                            if (ev) {
                                if (ev.status === 'incomplete') {
                                    node.content.addEval('highest-depth', o.maxDepth, o.depth, o.nodes, o.cp, o.mate, o.pvs, this.emgr.name)
                                    if(node.content.evals['highest-depth'].status === 'complete'){
                                        this.nodeAssessMove(node)
                                    }
                                    this.cursorStore.notifyEvalUpdate()
                                    this.setAutoShapes(node)
                                } else if (ev.status === 'complete') {
                                    node.content.updating = false
                                    this.tms.tree.logUpdate({pid:node.pid})
                                    console.log("!!!!!!! 3 UPDATING = FALSE")
                                }
                            } else {
                                node.content.addEval('highest-depth', o.maxDepth, o.depth, o.nodes, o.cp, o.mate, o.pvs, this.emgr.name)
                                this.cursorStore.notifyEvalUpdate()
                                this.setAutoShapes(node)
                            }

                        } // altrimenti ferma il motore

                    },
                    oncompleted: (id) => {
                        let node = this.tms.tree.node(id)
                        node.content.updating = false
                        console.log("!!!!!!! 4 UPDATING = FALSE")
                    }
                })
                    
            }
                */
        },
        
        dequeue(){
            /*
            console.log('queue size: ' + this.engineQueue.size);
            if(this.engineQueue.size === 0){
                this.currentLineStore.notifyFinishEval()
            }
            
            [...this.engineQueue].every(elem=>{
                console.log('queue: ' + elem)
                return true
            });
            // scoda i task
            [...this.engineQueue].every(elem=>{
                console.log(" ==> dequeue " + elem)
                let cnode = this.tms.tree.node(elem)
                if (cnode.content) {
                    if(cnode.content.evals['lichess-depth'] !== undefined){
                        // Una valutazione di lichess è stata trovata
                        this.engineQueue.delete(elem)
                        if(this.engineQueue.size === 0){
                            this.currentLineStore.notifyFinishEval()
                        }
                        return true
                    }
                    let cce = cnode.content.evals['highest-depth'];
                    if(cce !== undefined){
                        if(cce.status === 'complete'){
                            // Una valutazione di stockfish è stata trovata
                            this.engineQueue.delete(elem)
                            if(this.engineQueue.size === 0){
                                this.currentLineStore.notifyFinishEval()
                            }
                            return true
                        }
                    }
                    // Fermo l'engine
                    //this.emgr.engine.stop()

                    // 
                    cnode.content.updating = true

                    this.emgr.engine.start({
                        id: cnode.id,
                        fen: cnode.content.fen,
                        maxDepth: 18,
                        multiPv: 3,
                        moves: [],
                        emit: (o) => {
                            let node = this.tms.tree.node(o.id)
                            if (node) {
                                let ev = node.content.evals['highest-depth']
                                if (ev) {
                                    if (ev.status === 'incomplete') {
                                        node.content.addEval('highest-depth', o.maxDepth, o.depth, o.nodes, o.cp, o.mate, o.pvs)
                                        if(this.cursorStore.node.id === elem){
                                            this.cursorStore.notifyEvalUpdate()
                                        }  
                                    } else if (ev.status === 'complete') {
                                        node.content.updating = false
                                        this.tms.tree.logUpdate({pid:node.pid})
                                        console.log("!!!!!!! 3 UPDATING = FALSE")
                                        
                                    }
                                } else {
                                    node.content.addEval('highest-depth', o.maxDepth, o.depth, o.nodes, o.cp, o.mate, o.pvs)
                                    if(this.cursorStore.node.id === elem){
                                        this.cursorStore.notifyEvalUpdate()
                                    }
                                }

                            } // altrimenti ferma il motore

                        },
                        oncompleted: (id) => {
                            let node = this.tms.tree.node(id)
                            node.content.updating = false
                            this.tms.tree.logUpdate({pid:node.pid})
                            console.log("!!!!!!! 4 UPDATING = FALSE")
                            this.currentLineStore.setLine(this.tms.tree.currentLine(id))
                            this.engineQueue.delete(elem)
                            this.dequeue()
                        }
                    })

                    // lavora un elemento alla volta
                    return false;
                }
            });
            */
        },

        

        trace() {
            /*
            let cnode = this.cursorStore.node
            if (cnode.content) {
                cnode.content.trace = { status: 'incomplete', data: [] }
            } else {
                return
            }
            console.log('trace init...')
            this.emgr.engine.start({
                id: cnode.id,
                fen: cnode.content.fen,
                maxDepth: 18,
                multiPv: 3,
                moves: [],
                emit: (o) => {
                    let node = this.tms.tree.node(o.id)
                    let c = node.content.fen.includes(' w ') ? 'white' : 'black';
                    if (node) {
                        let status = node.content.trace.status
                        if (status) {
                            if (status === 'incomplete') {
                                node.content.addTrace(o.maxDepth, o.depth, c, o.pvs)
                                //console.log("-add to trace: " + o.cp)
                                this.cursorStore.notifyEvalUpdate()
                            } else if (status === 'complete') {
                                node.content.updating = false
                                console.log("!!!!!!! END")
                            }
                        } else {
                            node.content.addTrace(o.maxDepth, o.depth, c, o.pvs)
                            //console.log("+add to trace: " + o.cp)
                            this.cursorStore.notifyEvalUpdate()
                        }

                    } // altrimenti ferma il motore

                },
                oncompleted: (id) => {
                    let node = this.tms.tree.node(id)
                    node.content.updating = false
                    this.jsonModelStore.jsonModel = this.tms.tree.root
                    this.jsonModelStore.tosave = true
                    console.log("!!!!!!! trace END")
                }
            })
                */
        },

        setAutoShapes(node) {
            /*
            if(!optionsStore.engineEnabled()){
                this.autoShapesStore.shapes = []
                return;
            }
               
            let shapes = []
            let c = node.content.fen.includes(' w ') ? 'white' : 'black';
            let evl = node.content.evals['lichess-depth']
            if (evl === undefined) {
                evl = node.content.evals['highest-depth']
                if (evl === undefined) {
                    // Imposta le autoshape del risultato dell'analisi stockfish local
                    this.autoShapesStore.shapes = []
                    return
                }
            }
            // Imposta le autoshape del risultato dell'analisi lichess
            evl.pvs.forEach(pv => {
                const shift = povDiff(c, evl.pvs[0], pv)
                if (shift >= 0 && shift < 0.2) {
                    if (!Array.isArray(pv.moves)) {
                        // si tratta di una stringa --> la converto in array
                        let mvs = pv.moves.split(" ")
                        pv.moves = mvs
                    }
                    let mv = uci2move(pv.moves[0])
                    let arrow = {
                        color: c,
                        move: pv.moves[0],
                        orig: mv.from,
                        dest: mv.to,
                        brush: (evl.pvs[0].moves[0] === pv.moves[0]) ? 'paleGreen' : 'paleGrey',
                        modifiers: { lineWidth: Math.round(12 - shift * 50) }
                    }
                    shapes = shapes.concat(arrow)
                }
                this.autoShapesStore.shapes = shapes;
            });
            */
        },
        width() {
            /*
            let size = layout.boardsize(store.sideWidth, store.sideHeight, layout.MAXWIDTH, layout.MINWIDTH, layout.MARGINX, layout.MARGINY, layout.MARGINLEFT);
            if (store.sideWidth < size + 50) {
                //console.log('Engine width: ' + size + "px");
                return size;
            }
            //console.log('Engine width: ' + (store.sideWidth - size - 50) + "px");
            return (store.sideWidth - size - 50) / 2;
            */
        },
        engineEnabled() {
            /*
            return optionsStore.engineEnabled();
            */
            return true;
        }
    },
    created() {
        //this.emgr.engine.init();
    }
}
</script>
<template>
    <div v-if="engineEnabled()">
        <div class="d-flex engine-banner">
            <div class="fs-4 fw-bold px-2" :class="{ 'color-updating': updating, 'color-completed': !updating }">{{
                bestscore
            }}
            </div>
            <div class="flex-grow-1 px-2" style="font-size:0.75rem;line-height:16px">
                <span class="pe-2" v-if="depth !== undefined">depth: <strong>{{ depth }}</strong>, nodes: {{
                    nodes
                }}</span><br />
                <!-- 
                <span class="pe-2 fst-italic" v-if="source === 'lichess'">Lichess cloud</span>
                <span class="pe-2 fst-italic" v-if="source === 'stockfish'">{{ emgr.name }}</span> -->
                <span class="pe-2 fst-italic">{{ sourcename }}</span>
                
            </div>
            <div class="fs-4 me-2" style="cursor: pointer;">
                <i class="fa-solid fa-sync" :class="{ 'fa-spin': updating }" @click.prevent="force"></i>
            </div>
        </div>
        <div v-for="(pv, index) of pvs.pvs" :key="pv.moves[0]">
            <PgnLine :fen="currentFen"
                     :nid="currentNodeId"
                     :uciLine="line(pv, pvs.type)" />
        </div>
    </div>
</template>
<style>
.color-updating {
    color: lightcoral
}

.color-completed {
    color: forestgreen
}

.engine-banner {
    background-color: #f2f2f2;
    border: 1px solid #ccc
}
</style>