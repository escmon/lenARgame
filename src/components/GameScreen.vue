<template>
  <div ref="gameContainer" class="relative w-full h-dvh overflow-hidden bg-slate-950 select-none">
    
    <div class="portrait-lock fixed inset-0 z-999 bg-slate-900 flex flex-col items-center justify-center text-center p-6">
      <div class="text-7xl mb-6 animate-bounce">📱🔄</div>
      <h2 class="text-3xl md:text-5xl font-black text-white mb-4">กรุณาหมุนหน้าจอ</h2>
      <p class="text-slate-400 text-lg md:text-2xl">โปรดหมุนอุปกรณ์เป็น "แนวนอน" <br>เพื่อให้กล้อง AR จับภาพมือได้กว้างที่สุดครับ</p>
    </div>

    <video ref="videoElement" class="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none -z-10" autoplay playsinline></video>
    <canvas ref="canvasElement" class="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"></canvas>

    <div class="absolute top-0 inset-x-0 p-4 md:p-6 flex justify-between items-start pointer-events-none z-10">
      <div class="bg-slate-900/70 backdrop-blur-md px-3 md:px-5 py-2 rounded-xl border border-white/10 text-center shadow-lg">
        <p class="text-[10px] md:text-xs text-yellow-400 font-bold">SCORE</p>
        <h2 class="text-xl md:text-3xl font-black text-white">{{ score }}</h2>
      </div>
      
      <div class="bg-slate-900/80 backdrop-blur-md px-6 md:px-12 py-3 md:py-4 rounded-2xl border border-cyan-500/40 text-center min-w-65 md:min-w-85 shadow-2xl transition-all duration-300 pointer-events-auto" :class="{ 'opacity-50 scale-95': isTransitioning }">
        <p class="text-[10px] md:text-xs text-cyan-400 font-bold uppercase tracking-widest mb-1 md:mb-2">{{ config.subject }} - {{ config.grade }} - {{ config.level }}</p>
        <h1 v-if="currentQuestion && currentQuestion.qType === 'text'" class="text-3xl md:text-5xl font-black text-white tracking-wide">{{ currentQuestion.qText }}</h1>
        <img v-else-if="currentQuestion && currentQuestion.qType === 'image'" :src="currentQuestion.qText" @click="triggerZoom" class="h-20 md:h-28 object-contain rounded-xl shadow-md bg-white/10 p-2 border border-white/20 cursor-pointer hover:scale-105 transition-transform" />
        <h1 v-else class="text-2xl md:text-4xl font-black text-white">กำลังโหลดโจทย์...</h1>
      </div>

      <div class="flex space-x-2 md:space-x-4">
        <button @click="toggleFullScreen" class="bg-slate-900/70 backdrop-blur-md px-3 md:px-4 py-2 rounded-xl border border-white/10 text-white shadow-lg pointer-events-auto hover:bg-slate-800 transition-colors"><span class="text-lg md:text-xl">🔲</span></button>
        <div class="bg-slate-900/70 backdrop-blur-md px-3 md:px-5 py-2 rounded-xl border border-white/10 text-center shadow-lg">
          <p class="text-[10px] md:text-xs text-red-400 font-bold">TIME</p>
          <h2 :class="['text-xl md:text-3xl font-black', timeLeft <= 20 ? 'text-red-500 animate-pulse' : 'text-red-400']">{{ timeLeft }}s</h2>
        </div>
      </div>
    </div>

    <div v-if="showZoom" @click="triggerZoom" class="fixed inset-0 bg-black/95 z-100 flex flex-col items-center justify-center cursor-pointer backdrop-blur-md animate-fade-in pointer-events-auto">
      <img :src="currentQuestion.qText" class="max-w-full max-h-[80vh] object-contain p-4 drop-shadow-2xl" />
      <p class="absolute bottom-10 text-white text-lg md:text-2xl font-bold animate-pulse bg-slate-900/80 px-8 py-3 rounded-full border border-white/20">⏱️ หยุดเวลาชั่วคราว (แตะเพื่อปิด)</p>
    </div>

    <div id="choices-layer" class="absolute inset-0 pointer-events-none z-20">
      <div v-for="(choice, index) in currentChoices" :key="index" :id="'choice-' + index"
           class="choice-box absolute rounded-2xl md:rounded-3xl transition-all duration-200 flex items-center justify-center overflow-visible"
           :class="choiceClasses[index]">
        <span v-if="choice.type === 'text'" class="text-2xl md:text-4xl font-black text-center px-2 drop-shadow-md">{{ choice.content }}</span>
        <img v-else-if="choice.type === 'image'" :src="choice.content" class="w-full h-full object-contain scale-125 drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]" draggable="false" />
      </div>
    </div>

    <div id="zone-tl" class="corner-zone top-0 left-0 rounded-br-3xl"></div>
    <div id="zone-tr" class="corner-zone top-0 right-0 rounded-bl-3xl"></div>
    <div id="zone-bl" class="corner-zone bottom-0 left-0 rounded-tr-3xl"></div>
    <div id="zone-br" class="corner-zone bottom-0 right-0 rounded-tl-3xl"></div>

    <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
      <div id="feedback-toast" class="text-4xl md:text-6xl font-black opacity-0 transition-all duration-300 scale-50"></div>
    </div>

    <div class="absolute bottom-8 md:bottom-12 inset-x-0 flex justify-center pointer-events-none z-10 px-4">
      <p class="text-xs sm:text-sm md:text-lg bg-slate-900/90 border border-slate-700 px-4 md:px-6 py-2 rounded-full text-slate-300 font-medium shadow-xl text-center">
        ✊ กำมือ/จีบนิ้ว เพื่อหยิบ | 🖐 กางมือ เพื่อปล่อยลงมุมจอ
      </p>
    </div>

    <div v-if="gameEnded" class="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 z-50 pointer-events-auto">
      <h2 class="text-5xl md:text-8xl text-red-500 font-black mb-4 drop-shadow-lg animate-bounce">{{ endMessage }}</h2>
      <p class="text-xl md:text-3xl text-slate-300 mb-8">คะแนนรวมทั้งหมดของคุณ</p>
      <div class="bg-slate-900 px-12 py-5 rounded-3xl border border-yellow-500 mb-10 shadow-[0_0_30px_rgba(234,179,8,0.3)]">
        <h3 class="text-6xl md:text-7xl font-black text-yellow-400">{{ score }}</h3>
      </div>
      <button @click="$emit('back-to-menu')" class="px-8 md:px-10 py-3 md:py-4 bg-linear-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-xl md:text-2xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer">กลับหน้าหลัก</button>
    </div>

    <div v-if="isLoading" class="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-40">
      <div class="text-2xl md:text-4xl font-black text-cyan-400 mb-4 animate-pulse">กำลังเตรียมระบบ AR...</div>
      <p class="text-sm md:text-base text-slate-400">กรุณาอนุญาตให้เบราว์เซอร์ใช้งานกล้อง</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAudio } from '../composables/useAudio' 

const props = defineProps({ config: Object })
const emit = defineEmits(['back-to-menu'])
const { playGrab, playCorrect, playWrong, playTimeout } = useAudio()

const gameContainer = ref(null)
const videoElement = ref(null)
const canvasElement = ref(null)

const score = ref(0)
const timeLeft = ref(100)
const isPlaying = ref(false)
const gameEnded = ref(false)
const isLoading = ref(true)
const endMessage = ref("หมดเวลา!")

const isTransitioning = ref(false)
const isPaused = ref(false)
const showZoom = ref(false)
let zoomTimeout = null

const questionsDb = ref([])
const currentQuestion = ref(null)
const currentChoices = ref([])
const choiceClasses = ref([
  'bg-slate-900/80 text-cyan-300 border-2 border-cyan-500/50 shadow-lg',
  'bg-slate-900/80 text-cyan-300 border-2 border-cyan-500/50 shadow-lg',
  'bg-slate-900/80 text-cyan-300 border-2 border-cyan-500/50 shadow-lg'
])

let camera = null
let hands = null
let timerInterval = null
let grabbedIndex = null
let isHandGrabbing = false
const choicePositions = [{ x: 0.2, y: 0.4 }, { x: 0.5, y: 0.7 }, { x: 0.8, y: 0.4 }]

const githubBaseUrl = "https://raw.githubusercontent.com/escmon/lenARgame/main/public"

const getFullImageUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('/images/')) return githubBaseUrl + path
  return path
}

const toggleFullScreen = () => {
  const elem = gameContainer.value || document.documentElement
  if (!document.fullscreenElement) elem.requestFullscreen().catch(err => console.log(err))
  else if (document.exitFullscreen) document.exitFullscreen()
}

const triggerZoom = () => {
  if (showZoom.value) { showZoom.value = false; isPaused.value = false; clearTimeout(zoomTimeout) }
  else { showZoom.value = true; isPaused.value = true; zoomTimeout = setTimeout(() => { showZoom.value = false; isPaused.value = false }, 5000) }
}

const showToast = (text, type) => {
  const toast = document.getElementById('feedback-toast')
  if (!toast) return
  toast.innerText = text
  toast.className = type === 'correct' ? "text-4xl md:text-6xl font-black text-green-400 animate-ping opacity-100" : "text-4xl md:text-6xl font-black text-red-500 animate-bounce opacity-100"
  setTimeout(() => toast.className = "text-4xl md:text-6xl font-black opacity-0 scale-50 transition-all duration-300", 800)
}

const fetchQuestions = async () => {
  try {
    let fetchUrl = props.config.level === 'vocab' ? '/data/english_vocab.json' : `/data/${props.config.grade}/${props.config.subject}_${props.config.grade}_${props.config.level}.json`
    const response = await fetch(fetchUrl)
    const allData = await response.json()
    if (props.config.level === 'vocab' && props.config.lesson !== 'all') {
      questionsDb.value = allData.filter(item => item.lesson == props.config.lesson)
      if(questionsDb.value.length === 0) questionsDb.value = allData 
    } else { questionsDb.value = allData }
    nextQuestion()
  } catch (error) { alert('ไม่สามารถโหลดโจทย์ได้') }
}

const nextQuestion = () => {
  if (questionsDb.value.length === 0) {
    endMessage.value = "เยี่ยม! จบชุดข้อสอบ"
    gameEnded.value = true; isPlaying.value = false; clearInterval(timerInterval)
    if (score.value > 0 && window.confetti) window.confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } })
    return
  }
  grabbedIndex = null
  if (props.config.level === 'vocab') {
    const selectedObj = questionsDb.value.splice(Math.floor(Math.random() * questionsDb.value.length), 1)[0]
    const correctWord = selectedObj.word
    let wrong1 = correctWord, wrong2 = correctWord
    if (questionsDb.value.length > 2) {
      while(wrong1 === correctWord) wrong1 = questionsDb.value[Math.floor(Math.random() * questionsDb.value.length)].word
      while(wrong2 === correctWord || wrong2 === wrong1) wrong2 = questionsDb.value[Math.floor(Math.random() * questionsDb.value.length)].word
    } else { wrong1 = "apple"; wrong2 = "banana" }
    const isTextQuestion = Math.random() > 0.5
    let choices = [correctWord, wrong1, wrong2].sort(() => Math.random() - 0.5)
    currentQuestion.value = {
      qType: isTextQuestion ? 'text' : 'image',
      qText: isTextQuestion ? correctWord : getFullImageUrl(`/images/vocab/${encodeURIComponent(correctWord)}.png`),
      a: correctWord,
      c: choices.map(w => ({ type: isTextQuestion ? 'image' : 'text', content: isTextQuestion ? getFullImageUrl(`/images/vocab/${encodeURIComponent(w)}.png`) : w, value: w }))
    }
  } else {
    const rawData = questionsDb.value.splice(Math.floor(Math.random() * questionsDb.value.length), 1)[0] 
    currentQuestion.value = {
      qType: rawData.img ? 'image' : 'text',
      qText: rawData.img ? getFullImageUrl(rawData.img) : rawData.q,
      a: rawData.a,
      c: rawData.c.map(text => ({ type: (text.includes('.png') || text.includes('.jpg')) ? 'image' : 'text', content: (text.includes('.png') || text.includes('.jpg')) ? getFullImageUrl(text) : text, value: text }))
    }
  }
  choicePositions.sort(() => Math.random() - 0.5)
  currentChoices.value = [...currentQuestion.value.c]
  for (let i = 0; i < 3; i++) { const el = document.getElementById(`choice-${i}`); if (el) el.style.display = 'flex' }
  setTimeout(() => {
    for (let i = 0; i < 3; i++) {
      const el = document.getElementById(`choice-${i}`)
      if (el) {
        el.style.left = `${choicePositions[i].x * window.innerWidth}px`
        el.style.top = `${choicePositions[i].y * window.innerHeight}px`
        choiceClasses.value[i] = currentChoices.value[i].type === 'image' ? 'bg-transparent border-transparent' : 'bg-slate-900/80 text-cyan-300 border-2 border-cyan-500/50 shadow-lg'
      }
    }
  }, 50)
}

const startGameTimer = () => {
  isPlaying.value = true
  timerInterval = setInterval(() => {
    if (!isTransitioning.value && !isPaused.value) {
      timeLeft.value--
      if (timeLeft.value <= 0) {
        clearInterval(timerInterval); isPlaying.value = false; gameEnded.value = true; endMessage.value = "หมดเวลา!"; playTimeout()
        if (score.value > 0 && window.confetti) window.confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } })
      }
    }
  }, 1000)
}

const checkCollision = (x, y, elId) => {
  const el = document.getElementById(elId)
  if (!el) return false
  const rect = el.getBoundingClientRect()
  return (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom)
}

const onResults = (results) => {
  if (isLoading.value) isLoading.value = false
  if (gameEnded.value) return
  const ctx = canvasElement.value ? canvasElement.value.getContext('2d') : null
  if (!ctx || !canvasElement.value) return

  ctx.save(); ctx.clearRect(0, 0, canvasElement.value.width, canvasElement.value.height)
  ctx.translate(canvasElement.value.width, 0); ctx.scale(-1, 1); ctx.drawImage(results.image, 0, 0, canvasElement.value.width, canvasElement.value.height)

  const hasHands = results.multiHandLandmarks && results.multiHandLandmarks.length > 0
  if (hasHands && !isPlaying.value && timeLeft.value === 100) startGameTimer()

  ['zone-tl', 'zone-tr', 'zone-bl', 'zone-br'].forEach(id => { const el = document.getElementById(id); if(el) el.classList.remove('corner-active') })

  if (hasHands && isPlaying.value) {
    const landmarks = results.multiHandLandmarks[0]
    window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, {color: 'rgba(34, 211, 238, 0.4)', lineWidth: 3})
    window.drawLandmarks(ctx, landmarks, {color: '#facc15', lineWidth: 1, radius: 3})

    const thumb = landmarks[4], indexTip = landmarks[8]
    const cursorX = window.innerWidth - (indexTip.x * window.innerWidth), cursorY = indexTip.y * window.innerHeight
    const distance = Math.hypot((thumb.x - indexTip.x) * window.innerWidth, (thumb.y - indexTip.y) * window.innerHeight)
    
    // กำหนดระยะห่างตามมือถือ/คอม
    const grabThreshold = window.innerWidth < 768 ? 30 : 40

    if (distance < grabThreshold) { isHandGrabbing = true } 
    else if (distance > grabThreshold + 20) {
      isHandGrabbing = false
      if (grabbedIndex !== null && !isTransitioning.value && !isPaused.value) {
        const el = document.getElementById(`choice-${grabbedIndex}`)
        if (el) { el.style.transition = 'all 0.4s ease'; el.style.left = `${choicePositions[grabbedIndex].x * window.innerWidth}px`; el.style.top = `${choicePositions[grabbedIndex].y * window.innerHeight}px` }
        choiceClasses.value[grabbedIndex] = currentChoices.value[grabbedIndex].type === 'image' ? 'bg-transparent border-transparent' : 'bg-slate-900/80 text-cyan-300 border-2 border-cyan-500/50 shadow-lg'
        grabbedIndex = null
      }
    }

    ctx.save(); ctx.scale(-1, 1); ctx.translate(-canvasElement.value.width, 0); ctx.beginPath(); ctx.arc(window.innerWidth - cursorX, cursorY, 14, 0, 2 * Math.PI)
    ctx.fillStyle = isHandGrabbing ? '#4ade80' : '#facc15'; ctx.shadowColor = isHandGrabbing ? '#4ade80' : '#facc15'; ctx.shadowBlur = 15; ctx.fill(); ctx.restore()

    if (isHandGrabbing && !isTransitioning.value && !isPaused.value) {
      if (grabbedIndex === null) {
        for (let i = 0; i < 3; i++) {
          if (checkCollision(cursorX, cursorY, `choice-${i}`)) {
            grabbedIndex = i; const el = document.getElementById(`choice-${grabbedIndex}`); if (el) el.style.transition = 'none'; playGrab()
            choiceClasses.value[i] = 'bg-white/20 backdrop-blur-md border-4 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.8)] text-white scale-110 md:scale-125 z-50'
            break
          }
        }
      } else {
        const el = document.getElementById(`choice-${grabbedIndex}`)
        const offset = window.innerWidth < 768 ? 40 : 80
        if (el) { el.style.left = `${cursorX - offset}px`; el.style.top = `${cursorY - offset}px` }
        
        let matchedZone = null
        if (checkCollision(cursorX, cursorY, 'zone-tl')) matchedZone = 'zone-tl'
        if (checkCollision(cursorX, cursorY, 'zone-tr')) matchedZone = 'zone-tr'
        if (checkCollision(cursorX, cursorY, 'zone-bl')) matchedZone = 'zone-bl'
        if (checkCollision(cursorX, cursorY, 'zone-br')) matchedZone = 'zone-br'

        if (matchedZone && !isTransitioning.value) {
          isTransitioning.value = true; document.getElementById(matchedZone).classList.add('corner-active')
          if (currentChoices.value[grabbedIndex].value === currentQuestion.value.a) { score.value += 10; showToast("ถูกต้อง! 🌟", 'correct'); playCorrect() } 
          else { showToast("ไม่ถูกต้อง ❌", 'wrong'); playWrong() }
          if (el) el.style.display = 'none'
          setTimeout(() => { isTransitioning.value = false; nextQuestion() }, 3000)
        }
      }
    }
  }
  ctx.restore()
}

onMounted(() => {
  canvasElement.value.width = window.innerWidth; canvasElement.value.height = window.innerHeight
  window.addEventListener('resize', () => { if(canvasElement.value) { canvasElement.value.width = window.innerWidth; canvasElement.value.height = window.innerHeight } })
  fetchQuestions()
  hands = new window.Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`})
  hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.6, minTrackingConfidence: 0.6 })
  hands.onResults(onResults)
  camera = new window.Camera(videoElement.value, { onFrame: async () => { if(videoElement.value) await hands.send({image: videoElement.value}) }, width: 640, height: 480, facingMode: 'user' })
  camera.start()
})
onUnmounted(() => { clearInterval(timerInterval); if (camera) camera.stop(); if (hands) hands.close() })
</script>

<style scoped>
.choice-box { width: 100px; height: 80px; pointer-events: none; }
.corner-zone { position: absolute; width: 90px; height: 90px; border: 3px dashed rgba(34, 211, 238, 0.4); background: rgba(34, 211, 238, 0.05); transition: all 0.2s; z-index: 15; }
.corner-active { border-color: #4ade80; background: rgba(74, 222, 128, 0.2); box-shadow: 0 0 30px rgba(74, 222, 128, 0.6); }

@media (min-width: 768px) {
  .choice-box { width: 160px; height: 120px; }
  .corner-zone { width: 140px; height: 140px; border-width: 4px; }
}

/* ล็อกหน้าจอแนวตั้ง (สำหรับมือถือ) */
.portrait-lock { display: none; }
@media screen and (orientation: portrait) and (max-width: 768px) {
  .portrait-lock { display: flex !important; }
}
</style>