<template>
  <main class="w-full min-h-screen bg-slate-950 text-white font-sans">
    
    <MainMenu 
      v-if="currentScene === 'menu'" 
      @start-game="handleStartGame" 
    />

    <GameScreen 
      v-if="currentScene === 'game'" 
      :config="gameConfig" 
      @back-to-menu="currentScene = 'menu'" 
    />

  </main>
</template>

<script setup>
import { ref, reactive } from 'vue'
import MainMenu from './components/MainMenu.vue'
import GameScreen from './components/GameScreen.vue'

const currentScene = ref('menu') 
const gameConfig = reactive({
  subject: '',
  grade: '', // เพิ่มตัวแปรระดับชั้น
  level: '',
  lesson: 'all'
})

const handleStartGame = (config) => {
  gameConfig.subject = config.subject
  gameConfig.grade = config.grade // รับค่าระดับชั้น
  gameConfig.level = config.level
  gameConfig.lesson = config.lesson 
  currentScene.value = 'game' 
}
</script>