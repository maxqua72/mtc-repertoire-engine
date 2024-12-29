<script>
//import { ipcRenderer } from 'electron';
import { UCIOption } from './EngineData.js'
import { useManagerStore } from '../stores/manager.js'

export default {
    name: 'Options',
    setup() {
        const mg = useManagerStore()
        return { mg }
    },
    data() {
        return {
            previouslyOpen: false,
            options: []
        }
    },
    props: {
        show: {
            type: Boolean,
            required: true
        }
    }, 
    watch: { 
        show(newVal) { 
            if (!newVal) { 
                this.previouslyOpen = true; 
                setTimeout(() => { 
                    this.previouslyOpen = false; 
                }, 300); // La durata della transizione in millisecondi 
            } 
        },
        'mg.currEngine'() {
            this.initOptions()
        }
    },
    computed: { 
        isOpen() { 
            return this.show; 
        } 
    }, 
    methods: { 
        closeOffcanvas() { 
            this.$emit('update:show', false); 
        },
        handleItemClick(index) { 
            this.mg.setCurrEngineByIdx(index); 
            this.closeOffcanvas();  
        },
        async chooseFile() {
            //this.$refs.inputfile.click();
            try { 
                const file = await window.electron.openFileDialog(); 
                if (file) { 
                    console.log('File path:', file); 
                    let ed = {
                        path: file.path,
                        file: file.name
                    }

                    this.mg.testEngine(ed)
                } else { 
                    console.log('File selection was canceled'); 
                } 
            } catch (error) { 
                console.error('Error opening file dialog:', error); 
            }
        },
        itemLabel(idx) {
            return 'label-' + idx
        
        },
        initOptions() {
            for(let def of this.mg.currEngine.default) {
                let uciopt = new UCIOption(def)
                for(let opt of this.mg.currEngine.options) {
                    if(opt.name === uciopt.name) {
                        uciopt.value = opt.value
                        break
                    }
                }
                if(uciopt.name === 'UCI_ShowWDL'){
                    uciopt.value = true
                }
                this.options.push(uciopt)
            }
            
        },
        saveOptions() {
            let opts = []
            for(let opt of this.options) {
                if(opt.default !== opt.value) {
                    opts.push(opt.toOption())
                }
            }
            this.mg.currEngine.options = opts
            this.mg.saveConfig()
            this.closeOffcanvas();  
        }
    },
    created(){
        this.initOptions()
    }
    
}
</script>

<template>
    <div>
        <div :class="['offcanvas offcanvas-end', { 'show': isOpen, 'hiding': !isOpen && previouslyOpen }]"
            tabindex="-1">
            <div class="offcanvas-header">
                <h5 class="offcanvas-title">Engine options</h5>
                <button type="button" class="btn-close" @click="closeOffcanvas"></button>
            </div>
            <div class="offcanvas-body">
                <div v-for="(item, index) in options" :key="index" class="nav-item">
                    <div v-if="item.type === 'string' && !item.name.startsWith('UCI_')" class="mb-2" :class="{'is-changed': item.default !== item.value}">
                        <label :for="itemLabel(index)">{{ item.name }}</label>
                        <input type="text" v-model.string="item.value" class="form-control" 
                            :id="itemLabel(index)" :title="item.default">
                    </div>

                    <div v-if="item.type === 'spin' && !item.name.startsWith('UCI_')" class="mb-2" :class="{'is-changed': item.default !== item.value}">
                        <label :for="itemLabel(index)">{{ item.name }}</label>
                        <input type="number" class="form-control"
                            v-model.number="item.value" :min="item.min" :max="item.max" step="1"
                            :id="itemLabel(index)" :title="item.default"  />
                    </div>
                    
                    <div class="form-check mb-2" v-if="item.type === 'check' && !item.name.startsWith('UCI_')" :class="{'is-changed': item.default !== item.value}">
                        <input class="form-check-input"
                            type="checkbox" v-model="item.value" 
                            :id="itemLabel(index)" :title="item.default">
                        <label :for="itemLabel(index)" class="form-check-label">{{ item.name }}</label>
                    </div>
                </div>
                <button type="button" class="btn btn-primary w-100" @click="saveOptions">Save</button>
            </div>
            
        </div>
        
    </div>
</template>

<style scoped>
.offcanvas {
    transition: transform 0.3s ease-in-out;
}

.offcanvas-start.show {
    transform: translateX(0);
}

.nav-link:hover {
    color: #ffffff;
    /* Colore testo al passaggio del mouse */
    background-color: #495057;
    /* Colore sfondo al passaggio del mouse */
}
.is-changed input {
    border-color: #ffcc00;
    /* Colore di evidenziazione */
    background-color: #fff8e1;
    /* Colore di sfondo leggermente diverso */
}
.is-changed label{
    font-weight: bold;
}
</style>