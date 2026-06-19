<template>
  <div ref="gameContainer" class="relative w-full h-dvh overflow-hidden bg-slate-950 select-none font-sarabun">
    
    <div class="portrait-lock fixed inset-0 z-999 bg-slate-900 flex flex-col items-center justify-center text-center p-6">
      <div class="text-7xl mb-6 animate-bounce">📱🔄</div>
      <h2 class="text-3xl md:text-5xl font-black text-white mb-4">กรุณาหมุนหน้าจอ</h2>
      <p class="text-slate-400 text-lg md:text-2xl">โปรดหมุนอุปกรณ์เป็น "แนวนอน" <br>เพื่อให้กล้อง AR จับภาพมือได้กว้างที่สุดครับ</p>
    </div>

    <video ref="videoElement" class="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none -z-10" autoplay playsinline></video>
    <canvas ref="canvasElement" class="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"></canvas>

    <div class="absolute top-0 inset-x-0 p-4 md:p-6 flex justify-between items-start pointer-events-none z-10">
      <div class="bg-slate-900/80 backdrop-blur-md px-4 md:px-6 py-2 md:py-3 rounded-2xl border border-white/20 text-center shadow-xl">
        <p class="text-[10px] md:text-sm text-yellow-400 font-bold uppercase">SCORE</p>
        <h2 class="text-2xl md:text-4xl font-black text-white">{{ score }}</h2>
      </div>
      
      <div class="bg-slate-900/90 backdrop-blur-md px-6 md:px-12 py-3 md:py-4 rounded-3xl border-b-4 border-cyan-400 text-center shadow-2xl transition-all duration-300 pointer-events-auto">
        <p class="text-xs md:text-sm text-cyan-400 font-bold mb-1">หมวดเรียงลำดับ (อนุบาล)</p>
        <h1 class="text-2xl md:text-4xl font-black text-white tracking-wide">{{ currentQuestion.instruction }}</h1>
        <p v-if="isTransitioning" class="text-yellow-400 text-xs md:text-base font-bold mt-1 md:mt-2 animate-pulse">เยี่ยมมาก! กำลังไปข้อถัดไป...</p>
      </div>

      <button @click="$emit('back-to-menu')" class="bg-slate-900/80 backdrop-blur-md px-4 md:px-6 py-2 md:py-3 rounded-2xl border border-red-500/50 text-red-400 font-bold shadow-xl pointer-events-auto hover:bg-red-500 hover:text-white transition-colors cursor-pointer">
        ออก
      </button>
    </div>

    <div class="absolute top-1/2 -translate-y-1/2 inset-x-0 flex justify-center gap-2 md:gap-8 z-10 pointer-events-none px-2">
      <div v-for="(zone, index) in 4" :key="'zone-'+index" :id="'drop-zone-'+index"
           class="drop-zone w-18.75 h-18.75 sm:w-24 sm:h-24 md:w-40 md:h-40 border-2 md:border-4 border-dashed rounded-2xl md:rounded-3xl flex flex-col items-center justify-center transition-all duration-300"
           :class="placedItems[index] ? 'border-green-400 bg-green-400/20 shadow-[0_0_20px_rgba(74,222,128,0.5)]' : 'border-white/40 bg-black/40'">
        
        <div v-if="placedItems[index]" class="w-full h-full flex items-center justify-center animate-bounce-in">
          <span v-if="placedItems[index].type === 'text'" class="text-4xl md:text-7xl font-black text-white drop-shadow-lg">{{ placedItems[index].content }}</span>
          <span v-else-if="placedItems[index].type === 'emoji'" :style="{ fontSize: (placedItems[index].size * 0.7) + 'px' }" class="drop-shadow-lg md:scale-125">{{ placedItems[index].content }}</span>
        </div>
        <span v-else class="text-white/20 text-3xl md:text-6xl font-black">{{ index + 1 }}</span>
      </div>
    </div>

    <div id="items-layer" class="absolute inset-0 pointer-events-none z-20">
      <div v-for="(item, index) in activeItems" :key="'item-'+item.id" :id="'drag-item-'+index"
           class="drag-item absolute flex items-center justify-center transition-transform duration-200"
           :class="[item.isDragging ? 'scale-125 z-50' : 'scale-100 z-20', !item.isPlaced ? 'opacity-100' : 'opacity-0 pointer-events-none']"
           :style="{ left: item.x + 'px', top: item.y + 'px', transition: item.isDragging ? 'none' : 'all 0.4s ease' }">
        
        <div class="w-full h-full flex items-center justify-center rounded-3xl transition-all duration-200"
             :class="{'bg-white/20 backdrop-blur-md border-4 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.8)]': item.isDragging}">
          <span v-if="item.type === 'text'" class="text-5xl md:text-7xl font-black text-white drop-shadow-md">{{ item.content }}</span>
          <span v-else-if="item.type === 'emoji'" :style="{ fontSize: (item.size * 0.7) + 'px' }" class="drop-shadow-md md:scale-125">{{ item.content }}</span>
        </div>
      </div>
    </div>

    <div class="absolute bottom-8 md:bottom-12 inset-x-0 flex justify-center pointer-events-none z-10 px-4">
      <p class="text-xs sm:text-sm md:text-xl bg-slate-900/90 border border-slate-700 px-4 md:px-8 py-2 md:py-3 rounded-full text-slate-300 font-bold shadow-xl text-center w-full max-w-lg">
        ✊ กำมือหยิบของ | 🖐 แบมือเพื่อปล่อยเรียงในกล่อง
      </p>
    </div>

    <div v-if="gameEnded" class="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 z-50 pointer-events-auto">
      <h2 class="text-6xl md:text-8xl text-green-400 font-black mb-4 drop-shadow-lg animate-bounce">เก่งมาก!</h2>
      <p class="text-2xl md:text-4xl text-white mb-8 text-center">เรียนรู้ลำดับได้ยอดเยี่ยมเลย</p>
      <div class="bg-slate-900 px-12 py-5 rounded-3xl border border-yellow-500 mb-10 shadow-[0_0_30px_rgba(234,179,8,0.3)]">
        <h3 class="text-5xl md:text-7xl font-black text-yellow-400">คะแนน: {{ score }}</h3>
      </div>
      <button @click="$emit('back-to-menu')" class="px-8 md:px-10 py-3 md:py-4 bg-linear-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-2xl md:text-3xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer">กลับหน้าหลัก</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAudio } from '../composables/useAudio'

const props = defineProps({ config: Object })
const emit = defineEmits(['back-to-menu'])
const { playGrab, playCorrect, playWrong } = useAudio()

const gameContainer = ref(null)
const videoElement = ref(null)
const canvasElement = ref(null)

const score = ref(0)
const gameEnded = ref(false)
const isTransitioning = ref(false)
const currentQ = ref(0)

const currentQuestion = ref({})
const activeItems = ref([])
const placedItems = ref([null, null, null, null])

let camera = null
let hands = null
let grabbedItemId = null
let isHandGrabbing = false

const getOffset = () => window.innerWidth < 768 ? 40 : 60

const generateQuestions = () => {
  const qs = []; const types = ['num_asc', 'num_desc', 'size_asc', 'size_desc']
  for(let i=0; i<10; i++) {
    const type = types[Math.floor(Math.random() * types.length)]; let instruction = ""; let items = []
    if (type === 'num_asc') {
      instruction = "เรียงจาก น้อย ไป มาก"
      const start = Math.floor(Math.random() * 5) + 1 
      items = [{ id: 0, content: start, type: 'text', correctIndex: 0 }, { id: 1, content: start+1, type: 'text', correctIndex: 1 }, { id: 2, content: start+2, type: 'text', correctIndex: 2 }, { id: 3, content: start+3, type: 'text', correctIndex: 3 }]
    } else if (type === 'num_desc') {
      instruction = "เรียงจาก มาก ไป น้อย"
      const start = Math.floor(Math.random() * 5) + 5 
      items = [{ id: 0, content: start, type: 'text', correctIndex: 0 }, { id: 1, content: start-1, type: 'text', correctIndex: 1 }, { id: 2, content: start-2, type: 'text', correctIndex: 2 }, { id: 3, content: start-3, type: 'text', correctIndex: 3 }]
    } else if (type === 'size_asc') {
      instruction = "เรียงจาก เล็ก ไป ใหญ่"
      const emoji = ['🍎', '🐘', '🐶', '⚽'][Math.floor(Math.random() * 4)]
      items = [{ id: 0, content: emoji, type: 'emoji', size: 40, correctIndex: 0 }, { id: 1, content: emoji, type: 'emoji', size: 60, correctIndex: 1 }, { id: 2, content: emoji, type: 'emoji', size: 80, correctIndex: 2 }, { id: 3, content: emoji, type: 'emoji', size: 100, correctIndex: 3 }]
    } else if (type === 'size_desc') {
      instruction = "เรียงจาก ใหญ่ ไป เล็ก"
      const emoji = ['🍎', '🐘', '🐶', '⚽'][Math.floor(Math.random() * 4)]
      items = [{ id: 0, content: emoji, type: 'emoji', size: 100, correctIndex: 0 }, { id: 1, content: emoji, type: 'emoji', size: 80, correctIndex: 1 }, { id: 2, content: emoji, type: 'emoji', size: 60, correctIndex: 2 }, { id: 3, content: emoji, type: 'emoji', size: 40, correctIndex: 3 }]
    }
    qs.push({ instruction, items })
  }
  return qs
}

const questionsList = generateQuestions()

const loadNextQuestion = () => {
  if (currentQ.value >= questionsList.length) { gameEnded.value = true; if (window.confetti) window.confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } }); return }
  isTransitioning.value = false; placedItems.value = [null, null, null, null]
  currentQuestion.value = questionsList[currentQ.value]
  const w = window.innerWidth, h = window.innerHeight, yPos = h * 0.75 
  const xPositions = [w*0.2, w*0.4, w*0.6, w*0.8].sort(() => Math.random() - 0.5)
  activeItems.value = currentQuestion.value.items.map((item, index) => ({ ...item, x: xPositions[index] - getOffset(), y: yPos - getOffset(), originalX: xPositions[index] - getOffset(), originalY: yPos - getOffset(), isDragging: false, isPlaced: false }))
}

const checkWinCondition = () => {
  if (placedItems.value.every(item => item !== null)) {
    isTransitioning.value = true; score.value += 50
    setTimeout(() => { currentQ.value++; loadNextQuestion() }, 2000)
  }
}

const isPointInRect = (px, py, rect) => (px >= rect.left && px <= rect.right && py >= rect.top && py <= rect.bottom)

const onResults = (results) => {
  if (gameEnded.value || isTransitioning.value) return
  const ctx = canvasElement.value ? canvasElement.value.getContext('2d') : null
  if (!ctx || !canvasElement.value) return

  ctx.save(); ctx.clearRect(0, 0, canvasElement.value.width, canvasElement.value.height)
  ctx.translate(canvasElement.value.width, 0); ctx.scale(-1, 1); ctx.drawImage(results.image, 0, 0, canvasElement.value.width, canvasElement.value.height)

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0]
    window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, {color: 'rgba(34, 211, 238, 0.4)', lineWidth: 3})
    window.drawLandmarks(ctx, landmarks, {color: '#facc15', lineWidth: 1, radius: 3})

    const thumb = landmarks[4], indexTip = landmarks[8]
    const cursorX = window.innerWidth - (indexTip.x * window.innerWidth), cursorY = indexTip.y * window.innerHeight
    const distance = Math.hypot((thumb.x - indexTip.x) * window.innerWidth, (thumb.y - indexTip.y) * window.innerHeight)
    const grabThreshold = window.innerWidth < 768 ? 30 : 40

    if (distance < grabThreshold) { isHandGrabbing = true } 
    else if (distance > grabThreshold + 20) {
      isHandGrabbing = false
      if (grabbedItemId !== null) {
        const item = activeItems.value.find(i => i.id === grabbedItemId)
        if (item) {
          item.isDragging = false; let droppedInZone = false
          for (let i = 0; i < 4; i++) {
            const zoneEl = document.getElementById(`drop-zone-${i}`)
            if (zoneEl && isPointInRect(cursorX, cursorY, zoneEl.getBoundingClientRect())) {
              if (item.correctIndex === i) {
                item.isPlaced = true; placedItems.value[i] = item; score.value += 10; playCorrect(); droppedInZone = true; checkWinCondition()
              } else { playWrong() }
              break
            }
          }
          if (!droppedInZone) { item.x = item.originalX; item.y = item.originalY }
        }
        grabbedItemId = null
      }
    }

    ctx.save(); ctx.scale(-1, 1); ctx.translate(-canvasElement.value.width, 0); ctx.beginPath(); ctx.arc(window.innerWidth - cursorX, cursorY, 14, 0, 2 * Math.PI)
    ctx.fillStyle = isHandGrabbing ? '#4ade80' : '#facc15'; ctx.shadowColor = isHandGrabbing ? '#4ade80' : '#facc15'; ctx.shadowBlur = 15; ctx.fill(); ctx.restore()

    if (isHandGrabbing) {
      if (grabbedItemId === null) {
        for (const item of activeItems.value) {
          if (!item.isPlaced) {
            const el = document.getElementById(`drag-item-${item.id}`)
            if (el && isPointInRect(cursorX, cursorY, el.getBoundingClientRect())) { grabbedItemId = item.id; item.isDragging = true; playGrab(); break }
          }
        }
      } else {
        const item = activeItems.value.find(i => i.id === grabbedItemId)
        if (item) { item.x = cursorX - getOffset(); item.y = cursorY - getOffset() }
      }
    }
  }
  ctx.restore()
}

onMounted(() => {
  canvasElement.value.width = window.innerWidth; canvasElement.value.height = window.innerHeight
  window.addEventListener('resize', () => { if(canvasElement.value) { canvasElement.value.width = window.innerWidth; canvasElement.value.height = window.innerHeight } })
  loadNextQuestion()
  hands = new window.Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`})
  hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.6, minTrackingConfidence: 0.6 })
  hands.onResults(onResults)
  camera = new window.Camera(videoElement.value, { onFrame: async () => { if(videoElement.value) await hands.send({image: videoElement.value}) }, width: 640, height: 480, facingMode: 'user' })
  camera.start()
})
onUnmounted(() => { if (camera) camera.stop(); if (hands) hands.close() })
</script>

<style scoped>
.drag-item { width: 80px; height: 80px; }
@media (min-width: 768px) { .drag-item { width: 120px; height: 120px; } }

@keyframes bounce-in { 0% { transform: scale(0.5); opacity: 0; } 60% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
.animate-bounce-in { animation: bounce-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }

.portrait-lock { display: none; }
@media screen and (orientation: portrait) and (max-width: 768px) { .portrait-lock { display: flex !important; } }
</style>