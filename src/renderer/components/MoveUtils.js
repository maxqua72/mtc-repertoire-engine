export const move2array = function (obj) {
    let ar = [obj.from, obj.to]
    return ar
}
export const move2coord = function (obj) {
    let ar = "" + obj.from + obj.to
    return ar
}
export const srcdst2move = function (src, dst) {
    return { from: src, to: dst }
}
export const uci2move = function (uci) {
    let src = uci.substr(0,2)
    let dst = uci.substr(2,2)
    let promotion = undefined
    let move = { from: src, to: dst }
    if(uci.length == 5){
        // promozione
        promotion =  uci.substr(4,1)
        move.promotion = promotion
    }
    return move
}

export const uci2moveFallback = function (uci) {
    let src = uci.substr(0,2)
    let dst = uci.substr(2,2)
    switch(uci){
        case 'e1h1':  dst = 'g1'; break;
        case 'e1a1':  dst = 'c1'; break;
        case 'e8h8':  dst = 'g8'; break;
        case 'e8a8':  dst = 'c8'; break;
    }
    return { from: src, to: dst }
}

/**
 * Corregge la UCI move dell'arrocco
 * @param {*} uci 
 * @param {*} fen 
 * @returns 
 */
export const ucifen2uci = function (uci,fen) {
    let tkn = fen.split(' ')
    let turn = tkn[1]
    let castleright = tkn[2]

    let src = uci.substr(0,2)
    let dst = uci.substr(2,2)
    let pro = uci.substr(4)
    if(castleright){
        if(turn === 'w'){
            if(uci === 'e1h1' && castleright.includes('K')) dst = 'g1'
            else if(uci === 'e1a1' && castleright.includes('Q')) dst = 'c1'
        } else {
            if(uci === 'e8h8' && castleright.includes('k')) dst = 'g8'
            else if(uci === 'e8a8' && castleright.includes('q')) dst = 'c8'
        }
    }
    return (src + dst + pro)
}

export const formatLastMove = function(fen, lastMove){
    if(lastMove.color){
        let fmn = fullMoveNumberFromFen(fen)
        if(lastMove.color === 'w'){
            return fmn + ". " + lastMove.san
        } else if(lastMove.color === 'b'){
            return (fmn - 1) + "... " + lastMove.san
        }
    } else {
        let color = colorFromFen(fen)
        let fmn = fullMoveNumberFromFen(fen)
        if(color === 'white'){
            return (fmn - 1) + "... " + lastMove.san
        } else if(color === 'black'){
            return (fmn) + ". " + lastMove.san
        }
    }
    return lastMove.san
}



const rawWinningChances = function (cp) {
    const MULTIPLIER = -0.00368208; // https://github.com/lichess-org/lila/pull/11148
    return 2 / (1 + Math.exp(MULTIPLIER * cp)) - 1;
}
const cpWinningChances = function (cp) {
    return rawWinningChances(Math.min(Math.max(-1000, cp), 1000))
}
const mateWinningChances = function (mate) {
    const cp = (21 - Math.min(10, Math.abs(mate))) * 100;
    const signed = cp * (mate > 0 ? 1 : -1);
    return rawWinningChances(signed);
}
const evalWinningChances = function (cp, mate) {
    return mate !== undefined ? mateWinningChances(mate) : cpWinningChances(cp);
}

export const toPov = function (color, diff) {
    return (color === 'white' ? diff : -diff);
}

export const povChances = function (color, cp, mate) {
    return toPov(color, evalWinningChances(cp, mate));
}


export const povDiff = function (color, e1, e2) {
    return (povChances(color, e1.cp, e1.mate) - povChances(color, e2.cp, e2.mate)) / 2;
}

export function renderEval(e) {
    e = Math.max(Math.min(Math.round(e / 10) / 10, 99), -99);
    return (e > 0 ? '+' : '') + e.toFixed(1);
}

export function colorFromFen(fen){
    return fen.includes(' w ') ? 'white' : 'black';
}

export function fullMoveNumberFromFen(fen){
    let buf = fen.split(' ')
    return buf[5];
}

export function assessMove(currPosEval, precPosEval, color){
    let ret = undefined
    let worse = true
    let delta = Math.abs(currPosEval - precPosEval)
    if(color !== undefined){
        if ((color === 'white' && (currPosEval - precPosEval > 0)) ||
            (color === 'black' && (currPosEval - precPosEval <= 0))){
            worse = true
        } else  worse = false
    }
    if(worse){
        if( delta >= .1 && delta < .2){
            ret = 'inaccuracy'
        } else if( delta >= .2 && delta < .3){
            ret = 'mistake'
        } else if( delta >= .3){
            ret = 'blunder'
        }
    } else {
        /*if( delta >= .1 && delta < .2){
            ret = 'interesting'
        } else */
        if( delta >= .2 && delta < .3){
            ret = 'great'
        }
    } 
    
    return ret
}