
<script>
import NoEngine from './components/NoEngine.vue'
import WithEngine from './components/WithEngine.vue'
import { useWsClientStore } from './stores/wsClient.js'
import { useManagerStore } from './stores/manager.js'

export default {
  name: 'App',
  components: {
    NoEngine, WithEngine
  },
  data() {
    return {
      noengines: null
    }
  },
  setup() {
    const mg = useManagerStore()
    return { mg }
  },
  watch: {
    'mg.connected'(){

    },
    'mg.notify'(){
      if(this.mg.engines.length > 0){
        this.noengines = false
      } else {
        this.noengines = true
      }
    }
  },
  created() {
    const cs = useWsClientStore()
    const mg = useManagerStore()
    cs.init()
    mg.init()
  }
};
</script>

<template>
  <div>
    
    <main>
      
      <NoEngine v-if="noengines === true"/>
      <WithEngine v-if="noengines === false"/>
      <i class="fas fa-spinner fa-spin d-flex justify-content-center" 
        style="font-size: 4rem;"
        v-if="noengines === null"></i>
      
    </main>
  </div>
</template>

<style scoped>



</style>

