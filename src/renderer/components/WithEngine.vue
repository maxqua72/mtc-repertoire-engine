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
            engineUsage: 'external',
            showOffcanvas: false,
            showOptions: false,
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            isValidFen: true,
            depth: 18,
            nLines: { value: 1, max: 1},
            nThreads: { value: 1, max: 1},
            nodes: 0,
            status: '',
            progress: 0,
            score: '',
            cp: 0,
            mate: undefined,
            wdl: { win: null, draw: null, loss: null },
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
                    let toBreak = 2
                    for(let opt of this.engine.default){
                        if(opt.name === 'MultiPV'){
                            this.nLines.value = opt.default
                            this.nLines.max = opt.max
                            toBreak--
                        } else if(opt.name === 'Threads'){
                            this.nThreads.value = opt.default
                            this.nThreads.max = opt.max
                            toBreak--
                        }
                        if(toBreak <= 0) break
                    }
                    for(let opt of this.engine.options){
                        if(opt.name === 'MultiPV'){
                            this.nLines.value = opt.value
                        } else if(opt.name === 'Threads'){
                            this.nThreads.value = opt.value
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
                    this.pvs = []
                    this.score = result.score.score
                    this.cp = result.score.cp
                    this.mate = result.score.mate
                    this.wdl = result.wdl
                }
                this.pvs.push(result)
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
            let found = false
            for(let opt of this.mg.currEngine.options){
                if(opt.name === 'MultiPV'){
                    if(opt.value !== this.nLines.value){
                        opt.value = this.nLines.value
                        found = true
                        this.mg.saveConfig()
                    }
                    break
                }
            }
            if(!found){
                this.mg.currEngine.options
            }
        },
        'nThreads.value'(){
            for(let opt of this.mg.currEngine.options){
                if(opt.name === 'Threads'){
                    if(opt.value !== this.nThreads.value){
                        opt.value = this.nThreads.value
                        this.mg.saveConfig()
                    }
                    break
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
            return (this.engineUsage === 'local');
        },
        isUsageExternal() {
            return (this.engineUsage === 'external');
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
        startEval(){
            this.reset()
            this.mg.startEval(this.fen, this.depth)
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
                if (pv.score.cp) cp = toPov(c, pv.score.cp)
                if (cp !== undefined) {
                    bs = renderEval(cp)
                } else if (pv.score.mate !== undefined) {
                    return "#" + pv.score.mate
                }
            }
            
            return bs
        },
        reset(){
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
                        <input class="form-check-input" type="checkbox" role="switch" id="switchEngineUse" checked>
                    </div>
                    <div :class="(isUsageExternal())?'':'text-body-tertiary'" class="mtc-200 text-start">External usage</div>
                </div>
                
            </div>
        </div>
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
                    <div class="input-group mt-2">
                        <label class="input-group-text" for="id-lines">Lines</label>
                        <input id="id-lines" type="number" class="form-control text-center" placeholder="num of lines" aria-label="Lines" v-model="nLines.value" min="1" :max="nLines.max">
                    </div>
                    <div class="input-group mt-2">
                        <label class="input-group-text" for="id-cpus">CPUs</label>
                        <input id="id-cpus" type="number" class="form-control text-center" placeholder="num of cpu" aria-label="CPUs" v-model="nThreads.value" min="1" :max="nThreads.max">
                    </div>
                    
                </div>
            </div>
            
        </div>
        <div class="text-center mt-3 mx-4">
            <Lines :fen="fen" :pvs="pvs"/>
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