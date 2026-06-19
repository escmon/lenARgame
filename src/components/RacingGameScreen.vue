<template>
  <div class="relative w-full h-screen overflow-hidden bg-slate-950 select-none font-sarabun flex">
    
    <!-- AR Video & Canvas (ซ่อนไว้เป็น Background) -->
    <video ref="videoElement" class="hidden" autoplay playsinline></video>
    <canvas ref="canvasElement" class="absolute inset-0 w-full h-full object-cover z-0 opacity-40"></canvas>

    <!-- LEFT: Player 1 Controls -->
    <div class="z-10 w-1/4 flex flex-col bg-linear-to-b from-red-900/90 to-red-800/80 border-r-4 border-yellow-400 p-4 gap-4 shadow-2xl">
      <div class="text-center bg-black/40 rounded-xl p-3">
        <div class="text-3xl font-black text-red-300">P1 (ซ้าย)</div>
        <div class="text-yellow-300 font-bold text-4xl mt-2">{{ p1Score }}</div>
        <div class="text-red-100 text-sm">คะแนน</div>
      </div>
      
      <div class="flex-1 flex flex-col justify-center gap-4 relative" id="p1-zone">
        <div v-for="(choice, index) in p1Choices" :key="index" :id="'p1-choice-' + index"
             class="p1-box bg-red-100 text-red-900 rounded-2xl py-6 text-center text-4xl font-black shadow-lg border-4 border-transparent transition-all">
          {{ choice }}
        </div>
      </div>
    </div>

    <!-- CENTER: Race Track & Question -->
    <div class="z-10 w-2/4 flex flex-col relative bg-linear-to-b from-sky-400 to-green-600">
      <!-- Question Display -->
      <div class="bg-slate-900/90 px-6 py-4 text-center border-b-4 border-yellow-400 shadow-xl">
        <div class="text-yellow-300 font-black text-5xl mb-2">{{ currentQuestion.qText }}</div>
        <div class="text-white text-lg">ข้อ {{ currentQ + 1 }} / 20</div>
      </div>

      <!-- Track -->
      <div class="flex-1 relative overflow-hidden bg-slate-800/50 mx-10 border-x-4 border-dashed border-white/50 flex">
        <!-- P1 Lane -->
        <div class="w-1/2 h-full relative border-r-4 border-dashed border-white/30 flex justify-center">
          <div class="absolute w-16 h-24 bg-red-500 rounded-xl transition-all duration-500 ease-out shadow-2xl border-2 border-white flex items-center justify-center text-white font-bold"
               :style="{ bottom: p1Progress + '%' }">P1</div>
        </div>
        <!-- P2 Lane -->
        <div class="w-1/2 h-full relative flex justify-center">
          <div class="absolute w-16 h-24 bg-blue-500 rounded-xl transition-all duration-500 ease-out shadow-2xl border-2 border-white flex items-center justify-center text-white font-bold"
               :style="{ bottom: p2Progress + '%' }">P2</div>
        </div>
        
        <!-- Finish Line -->
        <div class="absolute top-0 w-full h-8 bg-repeat-x opacity-80" style="background-image: repeating-linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), repeating-linear-gradient(45deg, #000 25%, #fff 25%, #fff 75%, #000 75%, #000); background-position: 0 0, 10px 10px; background-size: 20px 20px;"></div>
      </div>
    </div>

    <!-- RIGHT: Player 2 Controls -->
    <div class="z-10 w-1/4 flex flex-col bg-linear-to-b from-blue-900/90 to-blue-800/80 border-l-4 border-yellow-400 p-4 gap-4 shadow-2xl">
      <div class="text-center bg-black/40 rounded-xl p-3">
        <div class="text-3xl font-black text-blue-300">P2 (ขวา)</div>
        <div class="text-yellow-300 font-bold text-4xl mt-2">{{ p2Score }}</div>
        <div class="text-blue-100 text-sm">คะแนน</div>
      </div>
      
      <div class="flex-1 flex flex-col justify-center gap-4 relative" id="p2-zone">
        <div v-for="(choice, index) in p2Choices" :key="index" :id="'p2-choice-' + index"
             class="p2-box bg-blue-100 text-blue-900 rounded-2xl py-6 text-center text-4xl font-black shadow-lg border-4 border-transparent transition-all">
          {{ choice }}
        </div>
      </div>
    </div>

    <!-- Game Over Screen -->
    <div v-if="gameEnded" class="absolute inset-0 z-50 bg-slate-900/95 flex flex-col items-center justify-center backdrop-blur-sm pointer-events-auto">
      <h1 class="text-7xl font-black text-yellow-400 mb-6 animate-bounce">{{ winnerText }}</h1>
      <div class="text-4xl text-white mb-10">P1: <span class="text-red-400">{{ p1Score }}</span> | P2: <span class="text-blue-400">{{ p2Score }}</span></div>
      <button @click="$emit('back-to-menu')" class="px-10 py-4 bg-linear-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-3xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer">กลับหน้าหลัก</button>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAudio } from '../composables/useAudio'

const props = defineProps({ config: Object })
const emit = defineEmits(['back-to-menu'])
const { playCorrect, playWrong } = useAudio()

const videoElement = ref(null)
const canvasElement = ref(null)

// Game States
const p1Score = ref(0)
const p2Score = ref(0)
const p1Progress = ref(5) // % 
const p2Progress = ref(5) // %
const currentQ = ref(0)
const gameEnded = ref(false)
const winnerText = ref('')

const questionsDb = ref([])
const currentQuestion = ref({})
const p1Choices = ref([])
const p2Choices = ref([])

let p1Answered = false
let p2Answered = false
let isTransitioning = false

// MediaPipe States
let camera = null
let hands = null
let p1Grabbing = false
let p2Grabbing = false

const fetchQuestions = async () => {
  // สุ่มโจทย์คณิตศาสตร์ง่ายๆ 20 ข้อแทนการดึงไฟล์
  questionsDb.value = Array.from({length: 20}, () => {
    let a = Math.floor(Math.random() * 9) + 1
    let b = Math.floor(Math.random() * 9) + 1
    let ans = a + b
    let c = [ans, ans + Math.floor(Math.random() * 3) + 1, ans - (Math.floor(Math.random() * 2) + 1)]
    return { qText: `${a} + ${b} = ?`, a: ans, c: c.sort(() => Math.random() - 0.5) }
  })
  nextQuestion()
}

const nextQuestion = () => {
  if (currentQ.value >= 20 || p1Progress.value >= 90 || p2Progress.value >= 90) {
    winnerText.value = p1Score.value > p2Score.value ? "🎉 ผู้เล่น 1 ชนะ!" : p2Score.value > p1Score.value ? "🎉 ผู้เล่น 2 ชนะ!" : "🤝 เสมอกัน!"
    gameEnded.value = true
    return
  }

  const q = questionsDb.value[currentQ.value]
  currentQuestion.value = q
  
  // สลับตัวเลือกให้ P1 และ P2
  p1Choices.value = [...q.c].sort(() => Math.random() - 0.5)
  p2Choices.value = [...q.c].sort(() => Math.random() - 0.5)

  p1Answered = false
  p2Answered = false
  isTransitioning = false
  
  // Reset Box Styles
  setTimeout(() => {
    document.querySelectorAll('.p1-box').forEach(el => { el.className = 'p1-box bg-red-100 text-red-900 rounded-2xl py-6 text-center text-4xl font-black shadow-lg border-4 border-transparent transition-all' })
    document.querySelectorAll('.p2-box').forEach(el => { el.className = 'p2-box bg-blue-100 text-blue-900 rounded-2xl py-6 text-center text-4xl font-black shadow-lg border-4 border-transparent transition-all' })
  }, 50)
}

const checkCollision = (x, y, elId) => {
  const el = document.getElementById(elId)
  if (!el) return false
  const rect = el.getBoundingClientRect()
  return (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom)
}

const handleAnswer = (playerNum, selectedValue, boxId) => {
  if (isTransitioning) return
  
  const el = document.getElementById(boxId)
  if (selectedValue == currentQuestion.value.a) {
    if (playerNum === 1) { p1Score.value += 10; p1Progress.value += 5; p1Answered = true; el.classList.add('bg-green-400', 'text-white', 'border-green-600') }
    else { p2Score.value += 10; p2Progress.value += 5; p2Answered = true; el.classList.add('bg-green-400', 'text-white', 'border-green-600') }
    playCorrect()
  } else {
    if (playerNum === 1) { p1Answered = true; el.classList.add('bg-slate-400', 'text-slate-500', 'opacity-50') }
    else { p2Answered = true; el.classList.add('bg-slate-400', 'text-slate-500', 'opacity-50') }
    playWrong()
  }

  // ถ้าตอบครบทั้งสองคน หรือมีคนเข้าเส้นชัย ให้ไปข้อต่อไป
  if ((p1Answered && p2Answered) || p1Progress.value >= 90 || p2Progress.value >= 90) {
    isTransitioning = true
    setTimeout(() => {
      currentQ.value++
      nextQuestion()
    }, 1500)
  }
}

const onResults = (results) => {
  if (gameEnded.value) return
  const ctx = canvasElement.value ? canvasElement.value.getContext('2d') : null
  if (!ctx || !canvasElement.value) return

  ctx.save()
  ctx.clearRect(0, 0, canvasElement.value.width, canvasElement.value.height)
  ctx.translate(canvasElement.value.width, 0)
  ctx.scale(-1, 1)

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    results.multiHandLandmarks.forEach((landmarks, index) => {
      
      const thumb = landmarks[4]
      const indexTip = landmarks[8]
      
      // แปลงพิกัด (Mirror)
      const cursorX = window.innerWidth - (indexTip.x * window.innerWidth)
      const cursorY = indexTip.y * window.innerHeight
      const distance = Math.hypot((thumb.x - indexTip.x) * window.innerWidth, (thumb.y - indexTip.y) * window.innerHeight)
      const isGrabbing = distance < 40

      // กำหนดสีเคอร์เซอร์: มือซ้ายจอ(P1)=แดง, มือขวาจอ(P2)=น้ำเงิน
      const isLeftHand = cursorX < window.innerWidth / 2
      
      ctx.beginPath()
      ctx.arc(indexTip.x * window.innerWidth, indexTip.y * window.innerHeight, 15, 0, 2 * Math.PI)
      ctx.fillStyle = isGrabbing ? '#facc15' : (isLeftHand ? '#ef4444' : '#3b82f6')
      ctx.fill()

      if (isGrabbing && !isTransitioning) {
        if (isLeftHand && !p1Answered) {
          for (let i = 0; i < 3; i++) {
            if (checkCollision(cursorX, cursorY, `p1-choice-${i}`)) {
              handleAnswer(1, p1Choices.value[i], `p1-choice-${i}`)
              break
            }
          }
        } else if (!isLeftHand && !p2Answered) {
          for (let i = 0; i < 3; i++) {
            if (checkCollision(cursorX, cursorY, `p2-choice-${i}`)) {
              handleAnswer(2, p2Choices.value[i], `p2-choice-${i}`)
              break
            }
          }
        }
      }
    })
  }
  ctx.restore()
}

onMounted(() => {
  canvasElement.value.width = window.innerWidth
  canvasElement.value.height = window.innerHeight

  fetchQuestions()

  hands = new window.Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`})
  // อัปเดตให้รองรับมือ 2 ข้าง
  hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.6, minTrackingConfidence: 0.6 })
  hands.onResults(onResults)

  camera = new window.Camera(videoElement.value, {
    onFrame: async () => { if(videoElement.value) await hands.send({image: videoElement.value}) },
    width: 640, height: 480, facingMode: 'user'
  })
  camera.start()
})

onUnmounted(() => {
  if (camera) camera.stop()
  if (hands) hands.close()
})
</script>