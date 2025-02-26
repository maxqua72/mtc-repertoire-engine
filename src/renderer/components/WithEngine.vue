<script>
import BoardGauge from './BoardGauge.vue';
import WDLMeter from './WDLMeter.vue';
import ChessBoard from './ChessBoard.vue'
import Lines from './Lines.vue';
import { useManagerStore } from '../stores/manager.js'
import { usePositionStore } from '../stores/position.js'
import OffCanvas from './OffCanvas.vue';
import Options from './Options.vue';
import { toPov, renderEval } from './MoveUtils.js'
import { Chess, SQUARES } from 'chess.js'
import { UCIOption, UCIParam } from './EngineData.js';
export default {
    name: 'WithEngine',
    components: {
        ChessBoard,
        BoardGauge,
        WDLMeter,
        Lines,
        OffCanvas,
        Options
    },
    data() {
        return {
            engine:{
                name: 'Stockfish',
            },
            engineUsage: {mode:'external', checkbox:true},
            showOffcanvas: false,
            showOptions: false,
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            isValidFen: true,
            depth: 18,
            nLines: { value: 1, max: 1, show: false},
            nThreads: { value: 1, max: 1, show: false},
            hash: { value: 1, max: 1, show: false},
            nodes: 0,
            status: '',
            progress: 0,
            score: '',
            cp: 0,
            mate: undefined,
            wdl: { win: null, draw: null, loss: null },
            pvsTmp: [],
            pvs: []
        }
    },
    setup() {
        const mg = useManagerStore()
        const pos = usePositionStore()
        return { mg, pos }
    },
    watch: {
        'mg.currEngine'() {
            if(this.mg.currEngine){
                if(!this.engine || this.engine.name !== this.mg.currEngine.name){
                    this.engine = this.mg.currEngine
                    let toBreak = 3
                    this.nLines.show = false
                    this.nThreads.show = false
                    this.hash.show = false
                    for(let opt of this.engine.default){
                        if(opt.name === 'MultiPV'){
                            this.nLines.value = opt.default
                            this.nLines.max = opt.max
                            this.nLines.show = true
                            toBreak--
                        } else if(opt.name === 'Threads'){
                            this.nThreads.value = opt.default
                            this.nThreads.max = opt.max
                            this.nThreads.show = true
                            toBreak--
                        } else if(opt.name === 'Hash'){
                            this.hash.value = opt.default
                            this.hash.max = opt.max
                            this.hash.show = true
                            toBreak--
                        }
                        if(toBreak <= 0) break
                    }
                    for(let opt of this.engine.options){
                        if(opt.name === 'MultiPV'){
                            this.nLines.value = opt.value
                        } else if(opt.name === 'Threads'){
                            this.nThreads.value = opt.value
                        } else if(opt.name === 'Hash'){
                            this.hash.value = opt.value
                        }
                    }
                    this.mg.bootEngine(this.engine)
                }
            }
        },
        'mg.currStatus'() {
            if(this.mg.currEngine){
                this.status = this.mg.currStatus
            }
        },
        'mg.notifyQueue'() {
            while (this.mg.infoQueue.length > 0) { 
                const result = this.mg.infoQueue.shift();  

                // do something with these data
                //console.log(result)
                this.nodes = result.nodes
                if(result.multipv === this.mg.maxPV){
                    this.progress = result.depth / this.depth
                }
                
                if(result.score){
                    result.score.score = this.bestscore(result)
                }
                if(result.multipv === 1){
                    // restart recording pvs
                    this.pvsTmp = []
                    this.score = result.score.score
                    this.cp = result.score.cp
                    this.mate = result.score.mate
                    this.wdl = result.wdl
                }
                if(result.pvsReady){
                    this.pvs = this.pvsTmp
                }
                this.pvsTmp.push(result)
            }
        },
        'mg.optionsSaved'(){
            for(let opt of this.mg.currEngine.options){
                if(opt.name === 'MultiPV'){
                    if(this.nLines.value !== opt.value){
                        this.nLines.discard = true
                        this.nLines.value = opt.value
                    }
                    
                } else if(opt.name === 'Threads'){
                    if(this.nThreads.value !== opt.value){
                        this.nThreads.discard = true
                        this.nThreads.value = opt.value
                    }
                } else if(opt.name === 'Threads'){
                    if(this.Hash.value !== opt.value){
                        this.Hash.discard = true
                        this.Hash.value = opt.value
                    }
                }
            }
        },
        'pos.toRun'(){
            // this.pos.fen is aasured to be valid
            this.fen = this.pos.fen
            this.isValidFen = true
            this.$nextTick(() => {
                setTimeout(() => { this.startEval(); }, 200);
            });
            
        },
        fen(newfen, oldfen) {
            if(newfen === this.pos.fen) return
            try{
                let chess = new Chess(this.fen)
                this.isValidFen = true
                this.pos.fen = this.fen
                this.pos.notifyChange()
            } catch(err){
                this.isValidFen = false
            }
        },
        'nLines.value'(){
            if(this.nLines.discard === true){
                this.nLines.discard = undefined
                return
            }
            for(let def of this.mg.currEngine.default){
                if(def.name === 'MultiPV'){
                    //uciopt = new UCIOption(def,this.nThreads.value)
                    let toSave = this.mg.currEngine.addOption(def,this.nLines.value)
                    if(toSave){
                        this.mg.saveConfig()
                        this.mg.notifyOptionsUpdated()
                    }
                }
            }
        },
        'nThreads.value'(){
            if(this.nThreads.discard === true){
                this.nThreads.discard = undefined
                return
            }
            for(let def of this.mg.currEngine.default){
                if(def.name === 'Threads'){
                    //uciopt = new UCIOption(def,this.nThreads.value)
                    let toSave = this.mg.currEngine.addOption(def,this.nThreads.value)
                    if(toSave){
                        this.mg.saveConfig()
                        this.mg.notifyOptionsUpdated()
                    }
                }
            }
            
        },
        'hash.value'(){
            if(this.hash.discard === true){
                this.hash.discard = undefined
                return
            }
            for(let def of this.mg.currEngine.default){
                if(def.name === 'Hash'){
                    //uciopt = new UCIOption(def,this.nThreads.value)
                    let toSave = this.mg.currEngine.addOption(def,this.hash.value)
                    if(toSave){
                        this.mg.saveConfig()
                        this.mg.notifyOptionsUpdated()
                    }
                }
            }
            
        }

    },
    computed: {
        buttonStyle() { 
            const percentage = this.progress * 100; 
            // Converti da 0-1 a 0-100 
            return { background: `linear-gradient(to right, #ffc107 ${percentage}%, #e0a800 ${percentage}%)` }; 
        },
        color() {
            return this.fen.includes(' w ') ? 'white' : 'black';
        },
        formatNodes() {
            return new Intl.NumberFormat('it_IT').format(this.nodes);
        }
        
    },
    methods: {
        isUsageLocal() {
            return (this.engineUsage.mode === 'local');
        },
        isUsageExternal() {
            return (this.engineUsage.mode === 'external');
        },
        toggleUsage(){
            if(this.engineUsage.checkbox){
                this.engineUsage.mode = 'external'
            } else {
                this.engineUsage.mode = 'local'
            }
            this.rebootEngine(this.engineUsage.mode)
        },
        toggleOffcanvas() {
            console.log('toggleOffcanvas: ' + this.showOffcanvas + ' -> ' + !this.showOffcanvas)
            this.showOffcanvas = !this.showOffcanvas
        },
        toggleOptions() {
            console.log('toggleOptions: ' + this.showOptions + ' -> ' + !this.showOptions)
            this.showOptions = !this.showOptions
        },
        bootEngine(){
            this.mg.bootEngine(this.engine)
        },
        rebootEngine(mode){
            this.mg.rebootEngine(this.engine, mode)
        },
        startEval(){
            this.reset()
            this.mg.startEval(this.fen, this.depth)
        },
        stopEval(){
            this.reset()
            this.mg.stopEval()
        },
        isReady(){
            return this.status === 'ready'
        }, 
        isEvaluating(){
            return this.status === 'evaluating'
        }, 
        bestscore(pv) {
            let bs = ''
            if(pv && pv.score){
                let c = this.fen.includes(' w ') ? 'white' : 'black';
                let cp = undefined
                if (pv.score.cp !== undefined) cp = toPov(c, pv.score.cp)
                if (cp !== undefined) {
                    bs = renderEval(cp)
                } else if (pv.score.mate !== undefined) {
                    return "#" + pv.score.mate
                }
            }
            
            return bs
        },
        reset(){
            this.pvsTmp = []
            this.pvs = []
            this.score = 0
            this.cp = this.score.cp
            this.mate = this.score.mate
            this.wdl = null
        }
    },
    created(){
        this.engine = this.mg.currEngine
    }
}
</script>

<template>
    <div v-if="engine">
    <OffCanvas :show.sync="showOffcanvas" @update:show="showOffcanvas = $event" />
    <Options :show.sync="showOptions" @update:show="showOptions = $event" />
    <div class="d-flex flex-column">
        <div class="text-center">
            <h3>{{ engine.name }}</h3>
            <div class="d-flex justify-content-center">
                <a class="link-offset-2 link-underline link-underline-opacity-50 mtc-lnk-size mtc-200 text-end" @click="toggleOffcanvas()" href="#">Cambia motore</a>
                <div class="vr mx-2"></div>
                <a class="link-offset-2 link-underline link-underline-opacity-50 mtc-lnk-size mtc-200 text-start" @click="toggleOptions()" href="#">Impostazioni</a>
            </div>
            
        </div>
        <div class="text-center mt-3">
            <div class="d-flex flex-column form-switch">
                <div class="d-flex justify-content-center">
                    <div :class="(isUsageLocal())?'':'text-body-tertiary'" class="mtc-200 text-end">Local usage</div>
                    <div style="width:80px">
                        <input class="form-check-input" type="checkbox" role="switch" id="switchEngineUse" v-model="engineUsage.checkbox" @change.stop.prevent="toggleUsage">
                    </div>
                    <div :class="(isUsageExternal())?'':'text-body-tertiary'" class="mtc-200 text-start">External usage</div>
                </div>
                
            </div>
        </div>
        <div v-if="isUsageLocal()">
            <div class="text-center mt-3 mx-4">
                <div class="d-flex justify-content-center">
                    <input class="form-control text-center mtc-fen" :class="{ 'is-invalid': !isValidFen, 'is-valid': isValidFen }"
                        type="text" placeholder="FEN" aria-label="FEN"
                        v-model="fen">
                </div>
                
                <div class="d-flex justify-content-center">
                    <div class="mt-1 me-1 w-25">
                        <div class="input-group mt-2">
                            <label class="input-group-text" for="id-nodes">Score</label>
                            <input id="id-nodes" type="text" class="form-control text-center fs-1 fw-bold" 
                                :class="{ 'color-updating': isEvaluating(), 'color-completed': !isEvaluating() }"
                                placeholder="-" aria-label="Score" :value="score" disabled>
                        </div>
                        <div class="input-group mt-2">
                            <label class="input-group-text" for="id-nodes">Nodes</label>
                            <input id="id-nodes" type="number" class="form-control text-center" placeholder="Nodes" aria-label="Nodes" :value="nodes" disabled>
                        </div>

                    </div>
                    <WDLMeter :wdl="wdl" :turn="color"/>
                    <ChessBoard />
                    <BoardGauge :cp="cp" :mate="mate" :color="color"/>
                    <div class="mt-2 w-25">
                        <button class="btn btn-secondary w-100" @click="startEval" v-if="!isReady() && !isEvaluating()">
                            {{ mg.currStatus }}
                        </button>
                        <button class="btn btn-primary w-100" @click="startEval" v-if="isReady()">
                            <i class="fas fa-play me-1"></i>
                            Start
                        </button>
                        <button class="btn btn-warning w-100" :style="buttonStyle" @click="stopEval" v-if="isEvaluating()">
                            <i class="fas fa-stop me-1"></i>
                            Stop
                        </button>
                        <div class="input-group mt-2">
                            <label class="input-group-text" for="id-depth">Depth</label>
                            <input id="id-depth" type="number" class="form-control text-center" placeholder="Depth" aria-label="Depth" v-model="depth" min="1" max="100">
                        </div>
                        <div class="input-group mt-2" v-if="nLines.show">
                            <label class="input-group-text" for="id-lines">Lines</label>
                            <input id="id-lines" type="number" class="form-control text-center" placeholder="num of lines" aria-label="Lines" v-model="nLines.value" min="1" :max="nLines.max">
                        </div>
                        <div class="input-group mt-2" v-if="nThreads.show">
                            <label class="input-group-text" for="id-cpus">CPUs</label>
                            <input id="id-cpus" type="number" class="form-control text-center" placeholder="num of cpu" aria-label="CPUs" v-model="nThreads.value" min="1" :max="nThreads.max">
                        </div>
                        <div class="input-group mt-2" v-if="hash.show">
                            <label class="input-group-text" for="id-hash">Hash</label>
                            <input id="id-hash" type="number" class="form-control text-center" placeholder="hash" aria-label="hash" v-model="hash.value" min="1" :max="hash.max">
                        </div>
                        
                    </div>
                </div>
                
            </div>
            <div class="text-center mt-3 mx-4">
                <Lines :fen="fen" :pvs="pvs"/>
            </div>
        </div>
        <div v-if="isUsageExternal()" class="text-center mt-3 mx-4">
            <div class="d-flex flex-column justify-content-center align-items-center">
                <!--
                <div class="input-group mt-2 mtc-max-600">
                    <label class="input-group-text" for="id-depth">Depth</label>
                    <input id="id-depth" type="number" class="form-control text-center" placeholder="Depth" aria-label="Depth" v-model="depth" min="1" max="100">
                </div>
                -->
                <div class="input-group mt-2 mtc-max-600" v-if="nLines.show">
                    <label class="input-group-text" for="id-lines">Lines</label>
                    <input id="id-lines" type="number" class="form-control text-center" placeholder="num of lines" aria-label="Lines" v-model="nLines.value" min="1" :max="nLines.max">
                </div>
                <div class="input-group mt-2 mtc-max-600" v-if="nThreads.show">
                    <label class="input-group-text" for="id-cpus">CPUs</label>
                    <input id="id-cpus" type="number" class="form-control text-center" placeholder="num of cpu" aria-label="CPUs" v-model="nThreads.value" min="1" :max="nThreads.max">
                </div>
                <div class="input-group mt-2 mtc-max-600" v-if="hash.show">
                    <label class="input-group-text" for="id-hash">Hash</label>
                    <input id="id-hash" type="number" class="form-control text-center" placeholder="hash" aria-label="hash" v-model="hash.value" min="1" :max="hash.max">
                </div>
            </div>
        </div>
    </div>
</div>
</template>



<style scoped>
.mtc-lnk-size {
    font-size: 0.8rem !important;
}
.form-switch {
    padding-left: 0;
}
.form-switch .form-check-input {
    margin-left: 0;
}
.mtc-200{
    width:200px;
}
.mtc-max-600{
    max-width:600px;
}
.mtc-fen{
    max-width: 600px;
    font-family: monospace;
    font-size: 0.8rem;
}
.color-updating {
    color: lightcoral
}

.color-completed {
    color: forestgreen
}


</style>