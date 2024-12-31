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
import { povDiff, colorFromFen, toPov, renderEval, uci2move, assessMove, povChances } from './MoveUtils.js'
import PgnLine from './PgnLine.vue'
import { useManagerStore } from '../stores/manager.js'
//import * as layout from './LayoutUtils.js'

//import { useEngineMgrStore} from "../../stores/engineMgr"


export default {
    name: 'Lines',
    components: {
        PgnLine
    },
    setup() {
        const mg = useManagerStore()
        return { mg }
    },
    props: {
        pvs: {
            type: Object
        },
        fen: {
            type: String
        },
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
            //engineQueue:new Set() // lista di id su cui effettuare l'analisi del computer
        }
    },
    watch: {
        pvs(){
            this.setAutoShapes()
        }
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
        /*
        bestscore() {
            let bs = 0
            
            let cnode = this.cursorStore.node
            
            if (cnode.content) {
                let c = cnode.content.fen.includes(' w ') ? 'white' : 'black';
                let ev = undefined
                let cp = undefined
                if (cnode.content.evals['highest-depth'] !== undefined) {
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

            return bs
        },
*/
        
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
        
        
    },
    methods: {
        
        score(color, cp, mate) {
            let rcp, bs
            if (cp !== undefined) rcp = toPov(color, cp)
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

        line(pv) {
            let line = {}
            
            if (this.pvs) {
                //let c = this.fen.includes(' w ') ? 'white' : 'black';
                line = {
                    score: pv.score.score, //this.score(c, pv.cp, pv.mate),
                    moves: pv.moves
                }
                if (pv.moves instanceof Array)
                    line.moves = pv.moves.join(' ')
            }
                    
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

        

        setAutoShapes() {
            /*
            if(!optionsStore.engineEnabled()){
                this.autoShapesStore.shapes = []
                return;
            }
            */   
            let shapes = []
            let c = this.fen.includes(' w ') ? 'white' : 'black';
            
            if(this.pvs === undefined || this.pvs.length === 0){
                this.mg.autoShapes.shapes = []
            }
            // Imposta le autoshape del risultato dell'analisi lichess
            this.pvs.forEach(pv => {
                const shift = toPov(c,povDiff(c, this.pvs[0], pv))
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
                        brush: (this.pvs[0].moves[0] === pv.moves[0]) ? 'paleGreen' : 'paleGrey',
                        modifiers: { lineWidth: Math.round(12 - shift * 50) }
                    }
                    shapes = shapes.concat(arrow)
                }
                this.mg.autoShapes.shapes = shapes;
            });
            
        },
    },
    created() {
        //this.emgr.engine.init();
    }
}
</script>
<template>
    <div class="pgn-lines-container pt-1">
        
        <div v-for="(pv, index) of pvs" :key="pv.multipv">
            <PgnLine :fen="fen"
                     :uciLine="line(pv)" />
        </div>
    </div>
</template>
<style scoped>
.pgn-lines-container {
    border-top: 1px solid lightgray;
    text-align: left !important
}
</style>