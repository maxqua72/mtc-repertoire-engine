<script>
//import { ipcRenderer } from 'electron';
//import { EngineData, UCIParam } from './engine'
import { useManagerStore } from '../stores/manager.js'

export default {
    name: 'NoEngine',
    setup() {
        const mg = useManagerStore()
        return { mg }
    },
    methods: {
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
        
    },
    mounted(){
        console.log('window.electron: ' + window.electron);
    }
}
</script>

<template>
    <div class="d-flex flex-column justify-content-center align-items-center full-height">
        <div class="pb-2" style="font-size:6rem">
            <i class="fa-regular fa-folder-open"></i>
        </div>
        <div class="p-2">Non ci sono motori configurati. Carica un motore.</div>
        <div class="p-2">
            <button class="btn btn-primary" @click="chooseFile">Nuovo motore</button>
            <!-- <input type="file" ref="inputfile" @change="handleFileChange" style="display:none"> -->
        </div>
    </div>
</template>

<style scoped>
.no-engine {
    text-align: center;
    margin-top: 20px;
}

.no-engine p {
    font-size: 18px;
    margin-bottom: 10px;
}

.full-height { 
    height: 100vh; 
}

</style>