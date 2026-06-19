<template>
  <div id="app">
    <MainMenu v-if="currentScene === 'menu'" @start-game="handleStartGame" @start-racing="handleStartRacing" />
    <GameScreen v-else-if="currentScene === 'game'" :config="gameConfig" @back-to-menu="currentScene = 'menu'" />
    <RacingGameScreen v-else-if="currentScene === 'racing'" :config="gameConfig" @back-to-menu="currentScene = 'menu'" />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import MainMenu from './components/MainMenu.vue'
import GameScreen from './components/GameScreen.vue'
import RacingGameScreen from './components/RacingGameScreen.vue'

const currentScene = ref('menu') 
const gameConfig = reactive({ subject: '', grade: '', level: '', lesson: 'all' })

const handleStartGame = (config) => {
  Object.assign(gameConfig, config)
  currentScene.value = 'game' 
}

const handleStartRacing = () => {
  currentScene.value = 'racing' 
}
</script>