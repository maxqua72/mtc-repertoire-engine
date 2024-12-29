<script>
//import { ipcRenderer } from 'electron';
//import { EngineData, UCIParam } from './engine'
import { useManagerStore } from '../stores/manager.js'

export default {
    name: 'OffCanvas',
    setup() {
        const mg = useManagerStore()
        return { mg }
    },
    data() {
        return {
            previouslyOpen: false
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
        }
    }
    
}
</script>

<template>
    <div>
        <div :class="['offcanvas offcanvas-start', { 'show': isOpen, 'hiding': !isOpen && previouslyOpen }]"
            tabindex="-1" data-bs-theme="dark">
            <div class="offcanvas-header">
                <h5 class="offcanvas-title text-light">Available engines</h5>
                <button type="button" class="btn-close" @click="closeOffcanvas"></button>
            </div>
            <div class="offcanvas-body">
                <ul class="navbar-nav flex-column">
                    <li>
                        <button class="btn btn-primary w-100 mb-2" @click="chooseFile">Nuovo motore</button>
                    </li>
                    <li v-for="(item, index) in mg.engines" :key="index" class="nav-item"> 
                        
                        <a href="#" class="nav-link ps-2"
                            @click.prevent="handleItemClick(index)">
                            <i class="fas fa-circle me-2" :class="[{'text-success': (index === mg.currEngineIdx)}]"></i>
                            {{ item.name }}
                        </a> 
                    </li>
                </ul>
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
</style>