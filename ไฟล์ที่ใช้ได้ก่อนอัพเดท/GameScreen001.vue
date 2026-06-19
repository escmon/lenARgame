<template>
  <div class="relative w-full h-screen overflow-hidden bg-slate-950 select-none">
    
    <video ref="videoElement" class="hidden" autoplay playsinline></video>
    <canvas ref="canvasElement" class="block w-full h-full object-cover"></canvas>

    <div class="absolute top-0 inset-x-0 p-6 flex justify-between items-start pointer-events-none z-10">
      <div class="bg-slate-900/70 backdrop-blur-md px-5 py-2 rounded-xl border border-white/10 text-center shadow-lg">
        <p class="text-xs text-yellow-400 font-bold">SCORE</p>
        <h2 class="text-3xl font-black text-white">{{ score }}</h2>
      </div>
      
      <div class="bg-slate-900/80 backdrop-blur-md px-12 py-4 rounded-2xl border border-cyan-500/40 text-center min-w-85 shadow-2xl flex flex-col items-center justify-center">
        <p class="text-xs text-cyan-400 font-bold uppercase tracking-widest mb-2">{{ config.subject }} - {{ config.level }}</p>
        
        <h1 v-if="currentQuestion && currentQuestion.qType === 'text'" class="text-5xl font-black text-white tracking-wide">
          {{ currentQuestion.qText }}
        </h1>
        <img v-else-if="currentQuestion && currentQuestion.qType === 'image'" :src="currentQuestion.qText" class="h-28 object-contain rounded-xl shadow-md bg-white/10 p-2 border border-white/20" />
        <h1 v-else class="text-4xl font-black text-white tracking-wide">กำลังโหลดโจทย์...</h1>
      </div>

      <div class="bg-slate-900/70 backdrop-blur-md px-5 py-2 rounded-xl border border-white/10 text-center shadow-lg">
        <p class="text-xs text-red-400 font-bold">TIME</p>
        <h2 :class="['text-3xl font-black', timeLeft <= 20 ? 'text-red-500 animate-pulse' : 'text-red-400']">{{ timeLeft }}s</h2>
      </div>
    </div>

    <div id="choices-layer" class="absolute inset-0 pointer-events-none z-20">
      <div 
        v-for="(choice, index) in currentChoices" 
        :key="index"
        :id="'choice-' + index"
        class="choice-box absolute rounded-2xl border shadow-lg transition-colors duration-200 flex items-center justify-center overflow-hidden"
        :class="choiceClasses[index]"
        style="width: 160px; height: 120px;"
      >
        <span v-if="choice.type === 'text'" class="text-3xl font-black">{{ choice.content }}</span>
        <img v-else-if="choice.type === 'image'" :src="choice.content" class="w-full h-full object-contain p-2" draggable="false" />
      </div>
    </div>

    <div id="zone-tl" class="corner-zone top-0 left-0 rounded-br-3xl"></div>
    <div id="zone-tr" class="corner-zone top-0 right-0 rounded-bl-3xl"></div>
    <div id="zone-bl" class="corner-zone bottom-0 left-0 rounded-tr-3xl"></div>
    <div id="zone-br" class="corner-zone bottom-0 right-0 rounded-tl-3xl"></div>

    <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
      <div id="feedback-toast" class="text-6xl font-black opacity-0 transition-all duration-300 scale-50"></div>
    </div>

    <div class="absolute bottom-4 inset-x-0 flex justify-center pointer-events-none z-10">
      <p class="text-lg bg-slate-900/90 border border-slate-700 px-6 py-2 rounded-full text-slate-300 font-medium shadow-md">
        ✊ กำมือ/จีบนิ้ว เพื่อหยิบ | 🖐 กางมือ เพื่อปล่อยลงมุมจอ
      </p>
    </div>

    <div v-if="gameEnded" class="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 z-50 pointer-events-auto">
      <h2 class="text-8xl text-red-500 font-black mb-4 drop-shadow-lg animate-bounce">หมดเวลา!</h2>
      <p class="text-3xl text-slate-300 mb-8">คะแนนรวมทั้งหมดของคุณ</p>
      <div class="bg-slate-900 px-12 py-5 rounded-3xl border border-yellow-500 mb-10 shadow-[0_0_30px_rgba(234,179,8,0.3)]">
        <h3 class="text-7xl font-black text-yellow-400">{{ score }}</h3>
      </div>
      <button @click="$emit('back-to-menu')" class="px-10 py-4 bg-linear-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-2xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer">กลับหน้าหลัก</button>
    </div>

    <div v-if="isLoading" class="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-40">
      <div class="text-4xl font-black text-cyan-400 mb-4 animate-pulse">กำลังเตรียมระบบ AR...</div>
      <p class="text-slate-400">กรุณาอนุญาตให้เบราว์เซอร์ใช้งานกล้อง</p>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAudio } from '../composables/useAudio' 

const props = defineProps({
  config: Object
})
const emit = defineEmits(['back-to-menu'])
const { playGrab, playCorrect, playWrong, playTimeout } = useAudio()

const videoElement = ref(null)
const canvasElement = ref(null)

const score = ref(0)
const timeLeft = ref(100)
const isPlaying = ref(false)
const gameEnded = ref(false)
const isLoading = ref(true)

const questionsDb = ref([])
const currentQuestion = ref(null)
const currentChoices = ref([])
const choiceClasses = ref([
  'bg-slate-900/80 text-purple-300 border-purple-500/50',
  'bg-slate-900/80 text-pink-300 border-pink-500/50',
  'bg-slate-900/80 text-indigo-300 border-indigo-500/50'
])

let camera = null
let hands = null
let timerInterval = null
let grabbedIndex = null
let isHandGrabbing = false
const choicePositions = [
  { x: 0.2, y: 0.4 }, { x: 0.5, y: 0.7 }, { x: 0.8, y: 0.4 }
]

const showToast = (text, type) => {
  const toast = document.getElementById('feedback-toast')
  if (!toast) return
  toast.innerText = text
  toast.className = type === 'correct' 
    ? "text-6xl font-black text-green-400 animate-ping opacity-100" 
    : "text-6xl font-black text-red-500 animate-bounce opacity-100"
  setTimeout(() => toast.className = "text-6xl font-black opacity-0 scale-50 transition-all duration-300", 800)
}

const fetchQuestions = async () => {
  try {
    // เช็คว่าถ้าเป็นโหมด vocab ให้ดึงไฟล์ english_vocab.json
    let filename = `${props.config.subject}_${props.config.level}.json`
    if (props.config.level === 'vocab') {
      filename = 'english_vocab.json'
    }

    const response = await fetch(`/data/${filename}`)
    const allData = await response.json()

    // ลอจิกฟิลเตอร์คำศัพท์ตามบทเรียน
    if (props.config.level === 'vocab' && props.config.lesson !== 'all') {
      questionsDb.value = allData.filter(item => item.lesson == props.config.lesson)
      
      // กันเหนียว เผื่อไม่มีคำศัพท์ในบทนั้น
      if(questionsDb.value.length === 0) {
        alert('ไม่พบคำศัพท์ในบทเรียนที่เลือก ระบบจะสุ่มจากทั้งหมดแทนครับ')
        questionsDb.value = allData 
      }
    } else {
      questionsDb.value = allData
    }

    nextQuestion()
  } catch (error) {
    console.error('Error loading questions:', error)
    alert('ไม่สามารถโหลดโจทย์ได้ กรุณาตรวจสอบไฟล์ในโฟลเดอร์ public/data')
  }
}

// ลอจิกใหม่: รองรับโหมดคำศัพท์รูปภาพและวิชาปกติ
const nextQuestion = () => {
  if (questionsDb.value.length === 0) return
  grabbedIndex = null
  
  // แบ่งลอจิกตามโหมด (vocab vs ทั่วไป)
  if (props.config.level === 'vocab') {
    const vocabList = questionsDb.value
    const correctWord = vocabList[Math.floor(Math.random() * vocabList.length)].word
    
    let wrong1 = correctWord, wrong2 = correctWord
    while(wrong1 === correctWord) wrong1 = vocabList[Math.floor(Math.random() * vocabList.length)].word
    while(wrong2 === correctWord || wrong2 === wrong1) wrong2 = vocabList[Math.floor(Math.random() * vocabList.length)].word

    const isTextQuestion = Math.random() > 0.5
    let choices = [correctWord, wrong1, wrong2].sort(() => Math.random() - 0.5)
    
    let mappedChoices = choices.map(w => ({
      type: isTextQuestion ? 'image' : 'text',
      content: isTextQuestion ? `/images/vocab/${encodeURIComponent(w)}.png` : w,
      value: w 
    }))

    currentQuestion.value = {
      qType: isTextQuestion ? 'text' : 'image',
      qText: isTextQuestion ? correctWord : `/images/vocab/${encodeURIComponent(correctWord)}.png`,
      a: correctWord,
      c: mappedChoices
    }
  } else {
    // โหมดวิชาทั่วไป
    const rawData = questionsDb.value[Math.floor(Math.random() * questionsDb.value.length)]
    currentQuestion.value = {
      qType: 'text',
      qText: rawData.q,
      a: rawData.a,
      c: rawData.c.map(text => ({ type: 'text', content: text, value: text }))
    }
  }

  choicePositions.sort(() => Math.random() - 0.5)
  currentChoices.value = [...currentQuestion.value.c]

  setTimeout(() => {
    for (let i = 0; i < 3; i++) {
      const el = document.getElementById(`choice-${i}`)
      if (el) {
        el.style.left = `${choicePositions[i].x * window.innerWidth}px`
        el.style.top = `${choicePositions[i].y * window.innerHeight}px`
        choiceClasses.value[i] = 'bg-slate-900/80 text-cyan-300 border-cyan-500/50'
      }
    }
  }, 50)
}

const startGameTimer = () => {
  isPlaying.value = true
  timerInterval = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      clearInterval(timerInterval)
      isPlaying.value = false
      gameEnded.value = true
      playTimeout()
      if (score.value > 0 && window.confetti) {
        window.confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } })
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

  ctx.save()
  ctx.clearRect(0, 0, canvasElement.value.width, canvasElement.value.height)
  
  ctx.translate(canvasElement.value.width, 0)
  ctx.scale(-1, 1)
  ctx.drawImage(results.image, 0, 0, canvasElement.value.width, canvasElement.value.height)

  const hasHands = results.multiHandLandmarks && results.multiHandLandmarks.length > 0

  if (hasHands && !isPlaying.value && timeLeft.value === 100) {
    startGameTimer()
  }

  ['zone-tl', 'zone-tr', 'zone-bl', 'zone-br'].forEach(id => {
    const el = document.getElementById(id)
    if(el) el.classList.remove('corner-active')
  })

  if (hasHands && isPlaying.value) {
    const landmarks = results.multiHandLandmarks[0]
    
    window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, {color: 'rgba(34, 211, 238, 0.4)', lineWidth: 3})
    window.drawLandmarks(ctx, landmarks, {color: '#facc15', lineWidth: 1, radius: 3})

    const thumb = landmarks[4]
    const indexTip = landmarks[8]
    
    const cursorX = window.innerWidth - (indexTip.x * window.innerWidth)
    const cursorY = indexTip.y * window.innerHeight

    const dx = (thumb.x - indexTip.x) * window.innerWidth
    const dy = (thumb.y - indexTip.y) * window.innerHeight
    const distance = Math.hypot(dx, dy)

    if (distance < 40) {
      isHandGrabbing = true
    } else if (distance > 75) {
      isHandGrabbing = false
      if (grabbedIndex !== null) {
        // ลอจิกใหม่: เมื่อกางมือปล่อย ให้คำตอบดีดกลับไปที่ตำแหน่งเดิม
        const el = document.getElementById(`choice-${grabbedIndex}`)
        if (el) {
          el.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' // เพิ่มเอฟเฟกต์เด้งดึ๋ง
          el.style.left = `${choicePositions[grabbedIndex].x * window.innerWidth}px`
          el.style.top = `${choicePositions[grabbedIndex].y * window.innerHeight}px`
        }
        choiceClasses.value[grabbedIndex] = 'bg-slate-900/80 text-cyan-300 border-cyan-500/50'
        grabbedIndex = null
      }
    }

    ctx.save()
    ctx.scale(-1, 1)
    ctx.translate(-canvasElement.value.width, 0)
    ctx.beginPath()
    ctx.arc(window.innerWidth - cursorX, cursorY, 14, 0, 2 * Math.PI)
    ctx.fillStyle = isHandGrabbing ? '#4ade80' : '#facc15'
    ctx.shadowColor = isHandGrabbing ? '#4ade80' : '#facc15'
    ctx.shadowBlur = 15
    ctx.fill()
    ctx.restore()

    if (isHandGrabbing) {
      if (grabbedIndex === null) {
        for (let i = 0; i < 3; i++) {
          if (checkCollision(cursorX, cursorY, `choice-${i}`)) {
            grabbedIndex = i
            
            // ปิดเอฟเฟกต์ Transition ชั่วคราวตอนที่กำลังลาก เพื่อไม่ให้เกิดอาการหน่วง (Lag)
            const el = document.getElementById(`choice-${grabbedIndex}`)
            if (el) el.style.transition = 'none' 

            playGrab()
            choiceClasses.value[i] = 'bg-linear-to-r from-purple-600 to-indigo-600 text-white border-yellow-400 animate-pulse'
            break
          }
        }
      } else {
        const el = document.getElementById(`choice-${grabbedIndex}`)
        if (el) {
          el.style.left = `${cursorX - 80}px`
          el.style.top = `${cursorY - 60}px` 
        }

        let matchedZone = null
        if (checkCollision(cursorX, cursorY, 'zone-tl')) matchedZone = 'zone-tl'
        if (checkCollision(cursorX, cursorY, 'zone-tr')) matchedZone = 'zone-tr'
        if (checkCollision(cursorX, cursorY, 'zone-bl')) matchedZone = 'zone-bl'
        if (checkCollision(cursorX, cursorY, 'zone-br')) matchedZone = 'zone-br'

        if (matchedZone) {
          document.getElementById(matchedZone).classList.add('corner-active')
          const answerGiven = currentChoices.value[grabbedIndex].value
          
          if (answerGiven === currentQuestion.value.a) {
            score.value += 10
            showToast("ถูกต้อง! 🌟", 'correct')
            playCorrect()
          } else {
            showToast("ไม่ถูกต้อง ❌", 'wrong')
            playWrong()
          }
          nextQuestion()
        }
      }
    }
  }
  ctx.restore()
}

onMounted(() => {
  canvasElement.value.width = window.innerWidth
  canvasElement.value.height = window.innerHeight
  window.addEventListener('resize', () => {
    if(canvasElement.value) {
      canvasElement.value.width = window.innerWidth
      canvasElement.value.height = window.innerHeight
    }
  })

  fetchQuestions()

  hands = new window.Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`})
  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
  })
  hands.onResults(onResults)

  camera = new window.Camera(videoElement.value, {
    onFrame: async () => {
      if(videoElement.value) await hands.send({image: videoElement.value})
    },
    width: 640,
    height: 480,
    facingMode: 'user'
  })
  camera.start()
})

onUnmounted(() => {
  clearInterval(timerInterval)
  if (camera) camera.stop()
  if (hands) hands.close()
})
</script>

<style scoped>
.choice-box {
  pointer-events: none;
}
.corner-zone {
  position: absolute;
  width: 140px;
  height: 140px;
  border: 4px dashed rgba(34, 211, 238, 0.4);
  background: rgba(34, 211, 238, 0.05);
  transition: all 0.2s;
  z-index: 15;
}
.corner-active {
  border-color: #4ade80;
  background: rgba(74, 222, 128, 0.2);
  box-shadow: 0 0 30px rgba(74, 222, 128, 0.6);
}
</style>