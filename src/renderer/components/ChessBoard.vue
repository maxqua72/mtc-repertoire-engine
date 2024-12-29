<script>
import { Chessground } from 'chessground';
import { usePositionStore } from '../stores/position.js'
//import { sideColorStore } from '../../stores/sideColor.js'
//import { lastEventFromBoard } from '../../stores/lastEventFromBoard.js'
//import { lastEventFromTree } from '../../stores/lastEventFromTree.js'
//import { autoShapesStore } from '../../stores/autoShapes.js'
import { Chess, SQUARES } from 'chess.js'
//import MoveEvent from '../MoveEvent.js'
//import ShapeEvent from '../ShapeEvent.js'
//import * as util from './MoveUtils.js'
//import * as layout from './LayoutUtils.js'

export default {
    name: 'ChessBoard',
    data() {
        return {
            content: {},
            conf: {
                //fen:'',
                orientation: 'white',
                drawable: {
                    eraseOnClick: false,
                    onChange: this.onChangeShape
                }
            },
            chess: undefined,
            board: undefined,
            //store,
            //sideColorStore,
            //lastEventFromBoard,
            //lastEventFromTree,
            //autoShapesStore
        }
    },

    props: {
        type: {
            type: String, // analisys, position
            default: 'analisys',
        },
        maxSize: {
            type: Number,
            default: 800//483,
        },
        minSize: {
            type: Number,
            default: 160,
        },
        margin: {
            type: Number,
            default: 8,
        },

        onPromotion: {
            type: Function,
            default: () => 'q',
        },
        viewOnly: {
            type: Boolean
        },
    },
    setup() {
        //const mg = useManagerStore()
        const pos = usePositionStore()
        //return { mg, pos }
        return { pos }
    },
    computed: {
        fenPosition() {
            if (this.chess != undefined)
                return this.chess.fen();
            return '';
        }
    },
    watch: {

        'sideColorStore.sideColor'(orientation) {
            
            if(this.sideColorStore.sideColor != this.conf.orientation){
                this.conf.orientation = this.sideColorStore.sideColor
                this.board.toggleOrientation()
            }
            
        },
        /*'lastEventFromBoard.changed'() {
            if (this.type != 'position' && this.board) {
                let event = lastEventFromBoard.event
                this.content = lastEventFromBoard.event
                console.log("Board received event from Board " + event.fen + " " + event.lastMove)

                try {
                    this.chess.load(event.fen)
                    this.board.set({
                        fen: this.chess.fen(),
                        lastMove: util.move2array(event.lastMove),
                        turnColor: this.toColor(),
                        movable: {
                            color: this.toColor(),
                            dests: this.possibleMoves()
                        }
                    });
                    if (event.shapes) {
                        this.board.setShapes(event.shapes)
                    }
                } catch (e) {
                    console.log(e)
                }
                this.lastEventFromBoard.notifyAck()
            }
        },*/
        /*
        'lastEventFromTree.changed'() {
            if (this.type != 'position' && this.board) {
                let event = lastEventFromTree.event
                this.content = lastEventFromTree.event
                console.log("Board received event from Tree " + event.fen + " " + event.lastMove)

                try {
                    this.chess.load(event.fen)
                    this.board.set({
                        fen: this.chess.fen(),
                        lastMove: util.move2array(event.lastMove),
                        turnColor: this.toColor(),
                        movable: {
                            color: this.toColor(),
                            dests: this.possibleMoves()
                        }
                    });
                    if (event.shapes) {
                        this.board.setShapes(event.shapes)
                    }
                } catch (e) {
                    console.log(e)
                }
                this.lastEventFromTree.notifyAck()
            }
        },
        'autoShapesStore.shapes'() {
            if (this.autoShapesStore.shapes) {
                // Converto il formato ricevuto in DrawShape
                let autoShapes = this.autoShapesStore.shapes
                this.board.setAutoShapes(autoShapes)
            }
        },
        'store.sideWidth'(){
            if(layout.isBoardTraslated(store.sideWidth, store.sideHeight, this.maxSize, this.minSize, layout.MARGINX, layout.MARGINY, layout.MARGINLEFT)){
                console.log("redrawAll 1")
                this.board.redrawAll()
            }
        },
        'store.redraw'(){
            console.log("redrawAll 2")
            this.board.redrawAll()
        },
        */
       'pos.changed'(){
              if(this.pos.fen){
                
                try {
                    this.chess.load(this.pos.fen)
                    this.board.set({
                        fen: this.chess.fen(),
                        lastMove: (this.pos.lastMove)?util.move2array(this.pos.lastMove):null,
                        turnColor: this.toColor(),
                        movable: {
                            color: this.toColor(),
                            dests: this.possibleMoves()
                        },
                        events: { change: this.onBoardChange()}
                    });
                    
                } catch (e) {
                    console.log(e)
                }
              }
       },
       
        viewOnly(){
            if(this.viewOnly){
                this.board.set({
                    movable: { color: undefined }
                })
            } else {
                this.board.set({
                    movable: { color: this.toColor() }
                })
            }
        }
    },
    methods: {
        
        size() {
            //let s = Math.max(Math.min(store.sideWidth - 30, store.sideHeight - 36, this.maxSize), this.minSize) - this.margin
            let s = layout.boardsize(store.sideWidth, store.sideHeight, this.maxSize, this.minSize, layout.MARGINX, layout.MARGINY, layout.MARGINLEFT)
            console.log('ChessBoard width: ' + s + "px")
            return s
        },
        onMove() {
            // Cattura la mossa effettuata nella board
        },
        toColor() {
            return (this.chess.turn() === 'w') ? 'white' : 'black';
        },
        possibleMoves() {
            // Restituisce l'elenco delle caselle relative alle possibili mosse
            let dests = new Map();
            SQUARES.forEach(s => {
                const ms = this.chess.moves({ square: s, verbose: true });
                if (ms.length) dests.set(s, ms.map(m => m.to));
            });
            return dests;
        },
        calculatePromotions() {
            let moves = this.chess.moves({ verbose: true })
            this.promotions = []
            for (let move of moves) {
                if (move.promotion) {
                    this.promotions.push(move)
                    console.log("promotions added: ")
                }
            }
            console.log("promotions: " + this.promotions.length)
        },
        isPromotion(orig, dest) {
            let filteredPromotions = this.promotions.filter(move => move.from === orig && move.to === dest)
            return filteredPromotions.length > 0 // The current movement is a promotion
        },
        playOtherSide() {
            return (orig, dest) => {
                console.log("playOtherSide orig: " + orig + "/dest: " + dest)

                let prevFen = this.chess.fen()
                let history = this.chess.history({ verbose: true })
                let prevMove = (this.content.lastMove)?this.content.lastMove.san:'-'
                if(history.length > 0){
                    prevMove = history[history.length - 1].san
                }
                    
                if (this.isPromotion(orig, dest)) {
                    console.log("isPromotion")
                    this.promoteTo = this.onPromotion()
                    // promotion va inserito nella move solo se necessario!!
                    this.chess.move({ from: orig, to: dest, promotion: this.promoteTo });
                } else {
                    this.chess.move({ from: orig, to: dest });
                }
                //console.log("promotions: " + this.promotions.length)
                console.log("old fen: " + prevFen + " new: " + this.chess.fen())
                //this.chess.move({ from: orig, to: dest });
                this.board.set({
                    fen: this.chess.fen(),
                    turnColor: this.toColor(),
                    movable: {
                        color: this.toColor(),
                        dests: this.possibleMoves()
                    }
                });
                this.calculatePromotions()
                this.afterMove(prevFen, prevMove)
            };
        },
        afterMove(prevFen, prevSan) {
            
            let history = this.chess.history({ verbose: true })
            let last = history[history.length - 1]
            //let moveEvent = new MoveEvent(this.chess.fen(), last, prevFen, prevSan)
            //this.lastEventFromBoard.event = moveEvent
            this.pos.fen = this.chess.fen()
            this.onBoardChange()
            //this.$emit('onMove', threats)
        },
        onChangeShape(shapes) {
            console.log("onChangeShape")
            let moveEvent = new ShapeEvent(this.chess.fen(), shapes)
            this.lastEventFromBoard.event = moveEvent
        },
        onBoardChange(){
            console.log("onBoardChange")
            this.pos.notifyToRun()
        }
    },
    mounted() {

        let config = {
            orientation: this.conf.orientation,
            viewOnly: (this.type === 'position'),
            coordinates: (this.type != 'position'),
            movable: {
                free: false,
                dests: this.possibleMoves()
            },
            drawable: this.conf.drawable
        };

        


        this.conf = config;
        this.board = Chessground(this.$refs.chessground, this.conf);
        if (this.type != 'position') {
            this.board.set({
                movable: { events: { after: this.playOtherSide() } }
            })

            if(this.viewOnly !== undefined){
                if(this.viewOnly){
                    this.board.set({
                        movable: { color: undefined }
                    })
                }
            }

        }
        //this.board.setShapes([{orig:"e2", dest:'e4',brush:'green'}])

    },
    created() {
        this.chess = new Chess()
        this.board = null
        this.promotions = []
        this.promoteTo = 'q'
/*
        if(this.sideColorStore.sideColor != this.conf.orientation){
            this.conf.orientation = this.sideColorStore.sideColor
        }
            */
    }
}   
</script>



<template>
    <!--
        ChessBiard
:style="{ width: size() + 'px', height: size() + 'px' }"

    -->
    <div id="ChessBoard" class="d-flex justify-content-center mt-2"  style="width:300px;height:300px">
        <div id="chessground" ref="chessground" style="width:300px;height:300px;"></div>
    </div>
    
</template>



<style scoped>
.main-board :deep(cg-board) {
    /*background-color: #bfcfdd;*/
    /*background-color: #f0d9b5 !important;*/
    background-image: url('/src/assets/brown.svg') !important;

}

.main-board {
    display: block;
    float: left
}

.box-fen {
    padding: 4px;
    border: 1px solid lightgray;
    background: white;
}

#chessground :deep(cg-container){
    outline: 2px solid black
}

</style>