<template>
  <div id="app">
    <MainMenu v-if="currentScene === 'menu'" 
              @start-game="handleStartGame" 
              @start-racing="handleStartRacing" 
              @start-sorting="handleStartSorting" />
              
    <GameScreen v-else-if="currentScene === 'game'" :config="gameConfig" @back-to-menu="currentScene = 'menu'" />
    <RacingGameScreen v-else-if="currentScene === 'racing'" :config="gameConfig" @back-to-menu="currentScene = 'menu'" />
    <SortingGameScreen v-else-if="currentScene === 'sorting'" :config="gameConfig" @back-to-menu="currentScene = 'menu'" />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import MainMenu from './components/MainMenu.vue'
import GameScreen from './components/GameScreen.vue'
import RacingGameScreen from './components/RacingGameScreen.vue'
import SortingGameScreen from './components/SortingGameScreen.vue' // <--- เพิ่ม Import ตรงนี้

const currentScene = ref('menu') 
const gameConfig = reactive({ subject: '', grade: '', level: '', lesson: 'all' })

const handleStartGame = (config) => {
  Object.assign(gameConfig, config)
  currentScene.value = 'game' 
}

const handleStartRacing = () => {
  currentScene.value = 'racing' 
}

const handleStartSorting = () => { // <--- เพิ่มฟังก์ชันสลับหน้าจอตรงนี้
  currentScene.value = 'sorting' 
}
</script>