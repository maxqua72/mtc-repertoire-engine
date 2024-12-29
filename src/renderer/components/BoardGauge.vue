<script>

//import { store } from '../../stores/store.js'
//import { cursorStore } from '../../stores/cursor.js'
//import { sideColorStore } from '../../stores/sideColor.js'
import { povChances, colorFromFen } from './MoveUtils.js'
//import * as layout from './LayoutUtils.js'
export default {
    name: 'BoardGauge',
    data() {
        return {
            //cp: 0,
            //mate: undefined,
            //color: 'w',
            reverseColor: false
        }
    },
    props: {
        cp: {
            type: Number,
            default: 0,
        },
        mate: {
            type: Number
        },
        color: {
            type: String,
            default: 'w',
        },
    },
    watch: {
        /*
        'cursorStore.evalUpdate'() {
            let evals = this.cursorStore.node.content.evals
            this.color = colorFromFen(this.cursorStore.node.content.fen)
            if (evals) {
                if (evals['lichess-depth'] !== undefined) {
                    this.cp = evals['lichess-depth'].cp
                    this.mate = evals['lichess-depth'].mate
                    this.type = 'lichess-depth'
                    console.log('lichess available for this position')
                } else if (evals['highest-depth'] !== undefined) {
                    this.cp = evals['highest-depth'].cp
                    this.mate = evals['highest-depth'].mate
                    this.type = 'highest-depth'
                    if(evals['highest-depth'].status === 'complete'){
                        console.log('highest depth available for this position')
                    } else {
                        console.log('highest depth ongoing for this position')
                    }
                }
            }
            //console.log("emitted!!!!!")
        },
        'sideColorStore.sideColor'(orientation) {
            this.reverseColor = (this.sideColorStore.sideColor === 'black')
        },
        */
    },
    computed: {
        
        height() {
            /*

            let h = layout.boardsize(store.sideWidth, store.sideHeight, layout.MAXWIDTH, layout.MINWIDTH, layout.MARGINX, layout.MARGINY, layout.MARGINLEFT)
            //return Math.max(Math.min(store.sideWidth - 30, store.sideHeight -36, this.maxSize), this.minSize) - this.margin
            return h
            */
           return 300
        },
        

        perc() {
            let gaugew = 0
            let gaugeb = 0
            if (!this.mate) {
                if (this.cp >= 0) {
                    gaugew = Math.min(1000, 500 + this.cp) / 10;
                    gaugeb = 100 - gaugew;
                } else {
                    gaugeb = Math.min(1000, 500 + -this.cp) / 10;
                    gaugew = 100 - gaugeb;
                }
            } else {
                if (this.mate >= 0) {
                    gaugew = 100;
                    gaugeb = 0;
                } else {
                    gaugeb = 100;
                    gaugew = 0;
                }
            }
            //console.log("gauge::::: " + gaugeb)
            return gaugeb
        },
        percLichess(){
            let ev = povChances(this.color,this.cp, this.mate)
            return 100 - (ev +1)*50
        }

    },
    methods: {
        round(num, decimal) {
            if (decimal === 0) return Math.round(num)
            else return Math.round((num + Number.EPSILON) * 10) / 10
        },
        
    }
} 
</script>

<template>

    <div class="gauge-box" :style="{ height: height + 'px' }" :class="{reverse:reverseColor}">
        <div class="bar">
            <div class="black" :style="{ height: perc + '%', display: 'none' }"></div>
            <div class="black" :style="{ height: percLichess + '%' }"></div>
            <div style="height: 12.5%"></div>
            <div style="height: 25%"></div>
            <div style="height: 37.5%"></div>
            <div class="zero" style="height: 50%"></div>
            <div style="height: 62.5%"></div>
            <div style="height: 75%"></div>
            <div style="height: 87.5%"></div>
            <div style="height: 100%"></div>

        </div>
    </div>

</template>

<style scoped>
.gauge-box {
    position: relative;
    overflow: hidden;
    font-size: .9em;
    width: 16px;
    background-color: white;
    border: 1px solid rgba(77, 77, 77, .17);
    margin-right:4px;
    margin-top: 10px !important;
    display: block;
    float: left
}



.gauge-box .bar div {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    border-bottom: 2px ridge #eee;
    opacity: .4;
    background-clip: padding-box;
    box-shadow: 0 -5px 4px rgb(0 0 0 / 10%) inset;
}

.gauge-box.reverse {
    transform: rotateX(180deg);
}

.gauge-box .bar div.black {
    width: 100%;
    height: 50%;
    background: #888;
    transition: height 1s;
    opacity: 1;
}

.gauge-box .bar div.zero {
    top: 6px;
    opacity: 1;
    border-bottom: 7px solid rgba(214, 79, 0, .4);
    margin-top: -3px;
}
</style>