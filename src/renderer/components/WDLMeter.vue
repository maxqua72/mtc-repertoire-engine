<script>

//import { store } from '../../stores/store.js'
//import { cursorStore } from '../../stores/cursor.js'
//import { sideColorStore } from '../../stores/sideColor.js'
import { povChances, colorFromFen } from './MoveUtils.js'
//import * as layout from './LayoutUtils.js'
export default {
    name: 'WDLMeter',
    data() {
        return {
            reverseColor: false,
            
        }
    },
    props: {
        wdl: {
            type: Object
        },
        turn: {
            type: String,
            default: 'w',
        },
    },
    watch: {
        turn() {
            console.log(".....turn:" + this.turn)
        },
    },
    computed: {
        rwin() {
            if(this.wdl && this.wwin){
                if(this.wwin > 60){
                    return this.round(this.wwin/10, 0) + ''
                }
            }
            return ''
            //return (this.wdl && this.wdl.win)?'' + this.round(this.wdl.win/10, 0):''
        },
        rdraw() {
            if(this.wdl && this.wdraw){
                if(this.wdraw > 60){
                    return this.round(this.wdraw/10, 0) + ''
                }
            }
            return ''
            //return (this.wdl && this.wdl.draw)?'' + this.round(this.wdl.draw/10, 0):''
        },
        rloss() {
            if(this.wdl && this.wloss){
                if(this.wloss > 60){
                    return this.round(this.wloss/10, 0) + ''
                }
            }
            return ''
            //return (this.wdl && this.wdl.loss)?'' + this.round(this.wdl.loss/10, 0):''
        },
        wwinval() {
            return (this.turn === 'white')?this.rwin:this.rloss
        },
        wdrawval() {
            return this.rdraw
        },
        wlossval() {
            return (this.turn === 'white')?this.rloss:this.rwin
        },
        wwin() {
            if(!this.wdl) return 0
            return (this.turn === 'white')?this.wdl.win:this.wdl.loss
        },
        wdraw() {
            if(!this.wdl) return 0
            return this.wdl.draw
        },
        wloss() {
            if(!this.wdl) return 0
            return (this.turn === 'white')?this.wdl.loss:this.wdl.win
        },
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
    <div class="wdl-meter">
        <div class="loss" :style="{ height: (wloss/10) + '%' }">{{wlossval}}</div>
        <div class="draw" :style="{ height: (wdraw/10) + '%' }">{{wdrawval}}</div>
        <div class="win" :style="{ height: (wwin/10) + '%' }">{{wwinval}}</div>
    </div>
</template>

<style scoped>
.wdl-meter {
    display: flex;
    flex-direction: column;
    height: 300px;
    width: 16px;
    margin-top: 10px !important;
    margin-right:4px;
    
    background-clip: padding-box;
    border: 0 solid rgba(77, 77, 77, .17);
    border-width: 1px 1px;

    font-size: .7rem;
    
}

.win,
.draw,
.loss {
    display: flex;
    align-items: center;
    justify-content: center;
    transition: height 1s;
}
.win {
    background-color: #ffffff;
    box-shadow: 5px -2px 7px #0000001a inset;
}

.draw {
    color: #fff;
    background-color: #a0a0a0;
    box-shadow: -5px 2px 7px #fff3 inset;
}

.loss {
    color: #fff;
    background-color: #555;
    box-shadow: -5px 2px 7px #fff3 inset;
}



</style>