export class UCIParam {
    constructor(name, type, value, min, max) {
        this.name = name;
        this.type = type;
        this.default = value;
        this.min = (min !== undefined) ? min : undefined;
        this.max = (max !== undefined) ? max : undefined;
    }
}
export class UCIOption {
    constructor(param, value) {
        this.name = param.name
        this.type = param.type
        this.default = param.default
        this.min = (param.min !== undefined) ? param.min : undefined
        this.max = (param.max !== undefined) ? param.max : undefined
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

    addOption(name, type, value) {
        this.options.push(new UCIParam(name, type, value));
    }
}

