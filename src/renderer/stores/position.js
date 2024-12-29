import { defineStore } from 'pinia'
import { colorFromFen} from '../components/MoveUtils.js'
export const usePositionStore = defineStore("position", {
    state: () => ({
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        lastMove: null,
        changed: 0,
        toRun: 0
    }),
    getters: {
        getColor : (state) => colorFromFen(state.fen)
    },
    actions: {
        notifyChange(){
            this.changed = (this.changed + 1)%64
        },
        notifyToRun(){
            this.toRun = (this.toRun + 1)%64
        }
    }

  
})
