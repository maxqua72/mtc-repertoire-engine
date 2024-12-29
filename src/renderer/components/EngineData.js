export class UCIParam {
    constructor(name, type, value, min, max, vars) {
        this.name = name;
        this.type = type;
        this.default = value;
        this.min = (min !== undefined) ? min : undefined;
        this.max = (max !== undefined) ? max : undefined;
        this.vars = (vars !== undefined) ? vars : undefined
    }
}
export class UCIOption {
    constructor(param, value) {
        this.name = param.name
        this.type = param.type
        this.default = param.default
        this.min = (param.min !== undefined) ? param.min : undefined
        this.max = (param.max !== undefined) ? param.max : undefined
        this.vars = (param.vars !== undefined) ? param.vars : undefined
        this.value = (value)?value:param.default
    }
    toOption() {
        return {name: this.name, type: this.type, value: this.value}
    }
}
export class EngineData {
    constructor(data) {
        this.name = data.name
        this.path = data.path
        this.file = data.file
        this.icon = data.icon
        this.author = data.icon
        this.default = (data.default)?data.default:[]
        this.options = (data.options)?data.options:[]
    }

    addDefault(name, type, value, min, max) {
        this.default.push(new UCIParam(name, type, value, min, max));
    }

    addOption(def, value) {
        let toSave = false
        let old = this.getOption(def.name)
        if(old === null){
            if(def.default !== value){
                let opt = new UCIOption(def, value)
                this.options.push(opt.toOption())
                toSave = true
            }
        } else {
            if(def.default !== value){
                old.value = value
                toSave = true
            } else {
                let index = this.options.findIndex(item => item.name === def.name)
                this.options.splice(index, 1)
                toSave = true
            }
        }
        return toSave
    }

    

    getOption(name){
        for(let opt of this.options){
            if(opt.name === name)
                return opt
        }
        return null
    }
}

