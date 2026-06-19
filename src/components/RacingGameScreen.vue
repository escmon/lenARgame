<template>
  <div ref="gameContainer" class="relative w-full h-dvh overflow-hidden bg-slate-950 select-none font-sarabun">
    
    <div class="portrait-lock fixed inset-0 z-999 bg-slate-900 flex flex-col items-center justify-center text-center p-6">
      <div class="text-7xl mb-6 animate-bounce">📱🔄</div>
      <h2 class="text-3xl md:text-5xl font-black text-white mb-4">กรุณาหมุนหน้าจอ</h2>
      <p class="text-slate-400 text-lg md:text-2xl">โปรดหมุนอุปกรณ์เป็น "แนวนอน" <br>เพื่อเล่นเกมแข่งรถ 2 คนครับ</p>
    </div>

    <video ref="videoElement" class="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none -z-10" autoplay playsinline></video>
    <canvas ref="canvasElement" class="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"></canvas>

    <div class="absolute inset-y-0 left-1/2 w-1 -ml-0.5 bg-yellow-400/50 border-x border-yellow-200/20 z-0 border-dashed"></div>

    <!-- UI ด้านบน: คะแนน ปุ่มเสียง และปุ่มออก -->
    <div class="absolute top-0 inset-x-0 p-4 flex justify-between items-start pointer-events-none z-10">
      <div class="bg-red-900/80 px-6 py-2 rounded-2xl border-2 border-red-500 shadow-xl text-center shadow-red-500/20">
        <p class="text-xs text-red-200 font-bold">P1 SCORE</p>
        <h2 class="text-3xl font-black text-white">{{ p1Score }}</h2>
      </div>
      
      <div class="flex gap-4 pointer-events-auto">
        <button @click="toggleFullScreen" class="bg-slate-900/80 px-4 py-2 rounded-2xl border border-white/20 text-white shadow-xl hover:bg-slate-800 transition-colors cursor-pointer text-xl">
          ♐
        </button>
        <!-- ปุ่มเปิด/ปิดเสียง -->
        <button @click="handleToggleMute" class="bg-slate-900/80 px-4 py-2 rounded-2xl border border-white/20 text-white font-bold shadow-xl hover:bg-slate-800 transition-colors cursor-pointer text-xl">
          {{ isMutedUI ? '🔇' : '🔊' }}
        </button>
        <button @click="$emit('back-to-menu')" class="bg-slate-900/80 px-6 py-2 rounded-2xl border border-white/20 text-white font-bold shadow-xl hover:bg-red-900 hover:border-red-500 transition-colors cursor-pointer">
          ออก
        </button>
      </div>

      <div class="bg-blue-900/80 px-6 py-2 rounded-2xl border-2 border-blue-500 shadow-xl text-center shadow-blue-500/20">
        <p class="text-xs text-blue-200 font-bold">P2 SCORE</p>
        <h2 class="text-3xl font-black text-white">{{ p2Score }}</h2>
      </div>
    </div>

    <!-- โจทย์คำถาม -->
    <div class="absolute top-20 left-4 md:left-12 z-10 pointer-events-none">
      <div class="bg-slate-900/90 px-8 py-3 rounded-2xl border border-red-500/50 shadow-2xl transition-all" :class="{'scale-110 border-green-400': p1Correct}">
        <p class="text-xs text-red-400 font-bold mb-1">P1 QUESTION</p>
        <h1 class="text-4xl md:text-5xl font-black text-white">{{ p1Question.q }}</h1>
      </div>
    </div>
    
    <div class="absolute top-20 right-4 md:right-12 z-10 pointer-events-none">
      <div class="bg-slate-900/90 px-8 py-3 rounded-2xl border border-blue-500/50 shadow-2xl transition-all" :class="{'scale-110 border-green-400': p2Correct}">
        <p class="text-xs text-blue-400 font-bold mb-1">P2 QUESTION</p>
        <h1 class="text-4xl md:text-5xl font-black text-white">{{ p2Question.q }}</h1>
      </div>
    </div>

    <!-- ลู่วิ่งแข่งรถ -->
    <div class="absolute inset-y-0 left-[40%] right-[40%] flex justify-between z-0 border-x-4 border-dashed border-white/20 bg-slate-900/40">
      <div class="w-1/2 relative">
        <div class="absolute left-1/2 -translate-x-1/2 w-12 h-20 transition-all duration-700 ease-out flex items-center justify-center animate-engine-idle" :style="{ bottom: p1Progress + '%' }">
          <div class="w-full h-full bg-linear-to-b from-red-500 to-red-700 rounded-xl shadow-lg border border-red-800 flex flex-col items-center justify-center relative">
            <div class="text-white font-black text-xl">P1</div>
            <div class="absolute -left-1.5 top-3 w-2 h-4 bg-slate-900 rounded-sm"></div><div class="absolute -left-1.5 bottom-3 w-2 h-4 bg-slate-900 rounded-sm"></div>
            <div class="absolute -right-1.5 top-3 w-2 h-4 bg-slate-900 rounded-sm"></div><div class="absolute -right-1.5 bottom-3 w-2 h-4 bg-slate-900 rounded-sm"></div>
          </div>
        </div>
      </div>
      <div class="w-1/2 relative border-l border-white/10">
        <div class="absolute left-1/2 -translate-x-1/2 w-12 h-20 transition-all duration-700 ease-out flex items-center justify-center animate-engine-idle" :style="{ bottom: p2Progress + '%' }">
          <div class="w-full h-full bg-linear-to-b from-blue-500 to-blue-700 rounded-xl shadow-lg border border-blue-800 flex flex-col items-center justify-center relative">
            <div class="text-white font-black text-xl">P2</div>
            <div class="absolute -left-1.5 top-3 w-2 h-4 bg-slate-900 rounded-sm"></div><div class="absolute -left-1.5 bottom-3 w-2 h-4 bg-slate-900 rounded-sm"></div>
            <div class="absolute -right-1.5 top-3 w-2 h-4 bg-slate-900 rounded-sm"></div><div class="absolute -right-1.5 bottom-3 w-2 h-4 bg-slate-900 rounded-sm"></div>
          </div>
        </div>
      </div>
      <div class="absolute top-0 w-full h-6 bg-repeat-x opacity-90 z-20" style="background-image: repeating-linear-gradient(45deg, #000 25%, #fff 25%, #fff 75%, #000 75%, #000); background-size: 20px 20px;"></div>
    </div>

    <!-- Drop Zones -->
    <div id="drop-zone-p1" class="absolute bottom-8 left-[15%] w-32 h-32 md:w-40 md:h-40 -translate-x-1/2 border-4 border-dashed rounded-3xl flex items-center justify-center transition-all duration-300 z-10" :class="p1Correct ? 'border-green-400 bg-green-400/20' : 'border-red-500/50 bg-slate-900/60'">
      <span class="text-red-300/50 font-bold text-center leading-tight">ลากคำตอบ<br>วางที่นี่</span>
    </div>
    
    <div id="drop-zone-p2" class="absolute bottom-8 right-[15%] w-32 h-32 md:w-40 md:h-40 translate-x-1/2 border-4 border-dashed rounded-3xl flex items-center justify-center transition-all duration-300 z-10" :class="p2Correct ? 'border-green-400 bg-green-400/20' : 'border-blue-500/50 bg-slate-900/60'">
      <span class="text-blue-300/50 font-bold text-center leading-tight">ลากคำตอบ<br>วางที่นี่</span>
    </div>

    <!-- กล่องตัวเลือก P1 -->
    <div id="p1-choices-layer" class="absolute inset-0 pointer-events-none z-20">
      <div v-for="(choice, index) in p1Choices" :key="'p1-c-'+index" :id="'p1-choice-'+index"
           class="absolute rounded-2xl flex items-center justify-center font-black transition-transform duration-200"
           :class="[choice.isDragging ? 'scale-125 z-50 bg-white border-4 border-red-500 text-red-600 shadow-[0_0_30px_rgba(239,68,68,0.8)]' : 'scale-100 z-20 bg-slate-800 border-2 border-red-400 text-red-300 shadow-lg']"
           :style="{ left: choice.x + 'px', top: choice.y + 'px', width: boxSize+'px', height: boxSize+'px', transition: choice.isDragging ? 'none' : 'all 0.4s ease' }">
        <span class="text-3xl md:text-5xl">{{ choice.val }}</span>
      </div>
    </div>

    <!-- กล่องตัวเลือก P2 -->
    <div id="p2-choices-layer" class="absolute inset-0 pointer-events-none z-20">
      <div v-for="(choice, index) in p2Choices" :key="'p2-c-'+index" :id="'p2-choice-'+index"
           class="absolute rounded-2xl flex items-center justify-center font-black transition-transform duration-200"
           :class="[choice.isDragging ? 'scale-125 z-50 bg-white border-4 border-blue-500 text-blue-600 shadow-[0_0_30px_rgba(59,130,246,0.8)]' : 'scale-100 z-20 bg-slate-800 border-2 border-blue-400 text-blue-300 shadow-lg']"
           :style="{ left: choice.x + 'px', top: choice.y + 'px', width: boxSize+'px', height: boxSize+'px', transition: choice.isDragging ? 'none' : 'all 0.4s ease' }">
        <span class="text-3xl md:text-5xl">{{ choice.val }}</span>
      </div>
    </div>

    <!-- จบเกม -->
    <div v-if="gameEnded" class="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 z-50 pointer-events-auto">
      <h2 class="text-7xl md:text-8xl text-yellow-400 font-black mb-4 drop-shadow-lg animate-bounce">{{ winnerMessage }}</h2>
      <button @click="$emit('back-to-menu')" class="mt-8 px-10 py-4 bg-linear-to-r from-red-500 to-blue-600 text-white rounded-xl text-3xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer">จบการแข่งขัน</button>
    </div>


    <div v-if="webglError" class="absolute inset-0 z-1000 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center pointer-events-auto backdrop-blur-sm">
      <div class="text-7xl mb-6 animate-bounce">⚠️</div>
      <h2 class="text-3xl md:text-5xl font-black text-red-500 mb-4">หน่วยความจำกล้องเต็ม</h2>
      <p class="text-slate-300 text-lg md:text-2xl mb-8">ระบบตรวจพบ WebGL Error (อาการจอดำ)<br>กรุณากดปุ่มด้านล่างเพื่อล้างแคชครับ</p>
      <button @click="clearCache" class="px-10 py-4 bg-red-600 hover:bg-red-500 active:scale-95 text-white rounded-2xl text-2xl font-bold shadow-[0_0_30px_rgba(220,38,38,0.6)] transition-all cursor-pointer">
        🛠️ ล้างแคชและรีสตาร์ท
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAudio } from '../composables/useAudio' 

const webglError = ref(false)

const clearCache = () => {
  window.location.reload();
}

const toggleFullScreen = () => {
  const elem = gameContainer.value || document.documentElement;
  if (!document.fullscreenElement) elem.requestFullscreen().catch(err => console.log(err));
  else if (document.exitFullscreen) document.exitFullscreen();
}

const props = defineProps({ config: Object })
const emit = defineEmits(['back-to-menu'])

// นำฟังก์ชันเสียงทั้งหมดเข้ามา
const { playGrab, playCorrect, playWrong, playWin, playBGM, stopBGM, toggleMute } = useAudio()
const isMutedUI = ref(false)

const videoElement = ref(null)
const canvasElement = ref(null)
let camera = null
let hands = null

const gameEnded = ref(false)
const isFinishing = ref(false)
const winnerMessage = ref('')

const p1Score = ref(0)
const p2Score = ref(0)
const p1Progress = ref(5)
const p2Progress = ref(5)
const WIN_PROGRESS = 85

const p1Question = ref({ q: '', a: 0 })
const p2Question = ref({ q: '', a: 0 })

const p1Choices = ref([])
const p2Choices = ref([])
const p1Correct = ref(false)
const p2Correct = ref(false)

const boxSize = window.innerWidth < 768 ? 70 : 100 

const p1State = { isGrabbing: false, grabbedId: null }
const p2State = { isGrabbing: false, grabbedId: null }

// ฟังก์ชันเปิด/ปิดเสียง
const handleToggleMute = () => {
  isMutedUI.value = toggleMute()
  if (!isMutedUI.value) playBGM() // ถ้าเปิดเสียง ให้เล่น BGM ทันที
}

const generateMath = () => {
  const isAdd = Math.random() > 0.5
  const num1 = Math.floor(Math.random() * 10) + 1
  const num2 = Math.floor(Math.random() * 10) + 1
  if (isAdd) return { q: `${num1} + ${num2} = ?`, a: num1 + num2 }
  else {
    const big = Math.max(num1, num2), small = Math.min(num1, num2)
    return { q: `${big} - ${small} = ?`, a: big - small }
  }
}

const spawnChoices = (player) => {
  const w = window.innerWidth
  const h = window.innerHeight
  const choices = []
  const question = player === 'p1' ? p1Question.value : p2Question.value
  
  let wrong1 = question.a + (Math.floor(Math.random() * 3) + 1)
  let wrong2 = Math.max(1, question.a - (Math.floor(Math.random() * 3) + 1))
  const vals = [question.a, wrong1, wrong2].sort(() => Math.random() - 0.5)

  vals.forEach((v, i) => {
    const minX = player === 'p1' ? w * 0.05 : w * 0.70
    const maxX = player === 'p1' ? w * 0.25 : w * 0.85
    const minY = h * 0.30
    const maxY = h * 0.60
    
    const posX = minX + (Math.random() * (maxX - minX))
    const posY = minY + (Math.random() * (maxY - minY))

    choices.push({ id: i, val: v, x: posX, y: posY, originX: posX, originY: posY, isDragging: false })
  })
  
  if (player === 'p1') p1Choices.value = choices
  else p2Choices.value = choices
}

const loadP1Next = () => { p1Correct.value = false; p1Question.value = generateMath(); spawnChoices('p1') }
const loadP2Next = () => { p2Correct.value = false; p2Question.value = generateMath(); spawnChoices('p2') }

const checkWin = () => {
  if (isFinishing.value) return 

  if (p1Progress.value >= WIN_PROGRESS) { 
    isFinishing.value = true
    p1Progress.value = 120 
    playWin() // เปิดเสียงชัยชนะ
    stopBGM() // หยุดดนตรีแบคกราวด์
    setTimeout(() => {
      gameEnded.value = true
      winnerMessage.value = "P1 WIN!"
      if (window.confetti) window.confetti({ particleCount: 200, spread: 100, zIndex: 1000 })
    }, 1200) 
  } 
  else if (p2Progress.value >= WIN_PROGRESS) { 
    isFinishing.value = true
    p2Progress.value = 120 
    playWin() // เปิดเสียงชัยชนะ
    stopBGM() // หยุดดนตรีแบคกราวด์
    setTimeout(() => {
      gameEnded.value = true
      winnerMessage.value = "P2 WIN!"
      if (window.confetti) window.confetti({ particleCount: 200, spread: 100, zIndex: 1000 })
    }, 1200)
  }
}

const isPointInRect = (px, py, rect) => (px >= rect.left && px <= rect.right && py >= rect.top && py <= rect.bottom)

const onResults = (results) => {
  if (gameEnded.value) return
  const canvas = canvasElement.value; if (!canvas) return
  const ctx = canvas.getContext('2d'); if (!ctx) return

  ctx.save()
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.translate(canvas.width, 0); ctx.scale(-1, 1)
  ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height)

  if (results.multiHandLandmarks) {
    let p1Landmarks = null
    let p2Landmarks = null

    results.multiHandLandmarks.forEach(landmarks => {
      const indexX = canvas.width * (1 - landmarks[8].x)
      if (indexX < canvas.width / 2) { if(!p1Landmarks) p1Landmarks = landmarks } 
      else { if(!p2Landmarks) p2Landmarks = landmarks } 
    })

    const grabThresh = canvas.width < 768 ? 35 : 45
    const relThresh = canvas.width < 768 ? 65 : 85
    const offset = boxSize / 2

    // ====== ลอจิก P1 ======
    if (p1Landmarks && !p1Correct.value && !isFinishing.value) {
      const idxTip = p1Landmarks[8], thumb = p1Landmarks[4]
      const curX = canvas.width * (1 - idxTip.x), curY = canvas.height * idxTip.y
      const dist = Math.hypot(curX - (canvas.width * (1 - thumb.x)), curY - (canvas.height * thumb.y))
      
      if (p1State.grabbedId === null) { p1State.isGrabbing = dist < grabThresh } 
      else { p1State.isGrabbing = dist <= relThresh }

      ctx.beginPath(); ctx.arc(idxTip.x * canvas.width, idxTip.y * canvas.height, 12, 0, 2*Math.PI)
      ctx.fillStyle = p1State.isGrabbing ? '#ef4444' : '#facc15'; ctx.fill()

      if (p1State.isGrabbing) {
        if (p1State.grabbedId === null) {
          for (let choice of p1Choices.value) {
            const el = document.getElementById(`p1-choice-${choice.id}`)
            if (el && isPointInRect(curX, curY, el.getBoundingClientRect())) {
              p1State.grabbedId = choice.id; choice.isDragging = true; playGrab(); break
            }
          }
        } else {
          const choice = p1Choices.value.find(c => c.id === p1State.grabbedId)
          if (choice) {
            choice.x = curX - offset; choice.y = curY - offset
            const dropZone = document.getElementById('drop-zone-p1')
            if (dropZone && isPointInRect(curX, curY, dropZone.getBoundingClientRect())) {
              if (choice.val === p1Question.value.a) {
                p1Correct.value = true; p1Score.value += 10; p1Progress.value += 15; playCorrect(); checkWin(); setTimeout(loadP1Next, 1500)
              } else { playWrong(); choice.x = choice.originX; choice.y = choice.originY }
              choice.isDragging = false; p1State.grabbedId = null
            }
          }
        }
      } else if (p1State.grabbedId !== null) {
        const choice = p1Choices.value.find(c => c.id === p1State.grabbedId)
        if (choice) { choice.isDragging = false; choice.x = choice.originX; choice.y = choice.originY }
        p1State.grabbedId = null
      }
    }

    // ====== ลอจิก P2 ======
    if (p2Landmarks && !p2Correct.value && !isFinishing.value) {
      const idxTip = p2Landmarks[8], thumb = p2Landmarks[4]
      const curX = canvas.width * (1 - idxTip.x), curY = canvas.height * idxTip.y
      const dist = Math.hypot(curX - (canvas.width * (1 - thumb.x)), curY - (canvas.height * thumb.y))
      
      if (p2State.grabbedId === null) { p2State.isGrabbing = dist < grabThresh } 
      else { p2State.isGrabbing = dist <= relThresh }

      ctx.beginPath(); ctx.arc(idxTip.x * canvas.width, idxTip.y * canvas.height, 12, 0, 2*Math.PI)
      ctx.fillStyle = p2State.isGrabbing ? '#3b82f6' : '#facc15'; ctx.fill()

      if (p2State.isGrabbing) {
        if (p2State.grabbedId === null) {
          for (let choice of p2Choices.value) {
            const el = document.getElementById(`p2-choice-${choice.id}`)
            if (el && isPointInRect(curX, curY, el.getBoundingClientRect())) {
              p2State.grabbedId = choice.id; choice.isDragging = true; playGrab(); break
            }
          }
        } else {
          const choice = p2Choices.value.find(c => c.id === p2State.grabbedId)
          if (choice) {
            choice.x = curX - offset; choice.y = curY - offset
            const dropZone = document.getElementById('drop-zone-p2')
            if (dropZone && isPointInRect(curX, curY, dropZone.getBoundingClientRect())) {
              if (choice.val === p2Question.value.a) {
                p2Correct.value = true; p2Score.value += 10; p2Progress.value += 15; playCorrect(); checkWin(); setTimeout(loadP2Next, 1500)
              } else { playWrong(); choice.x = choice.originX; choice.y = choice.originY }
              choice.isDragging = false; p2State.grabbedId = null
            }
          }
        }
      } else if (p2State.grabbedId !== null) {
        const choice = p2Choices.value.find(c => c.id === p2State.grabbedId)
        if (choice) { choice.isDragging = false; choice.x = choice.originX; choice.y = choice.originY }
        p2State.grabbedId = null
      }
    }
  }
  ctx.restore()
}

onMounted(() => {
  canvasElement.value.width = window.innerWidth; canvasElement.value.height = window.innerHeight
  window.addEventListener('resize', () => { if(canvasElement.value) { canvasElement.value.width = window.innerWidth; canvasElement.value.height = window.innerHeight }})
  
  // 🔥 ดักจับ WebGL เผื่อฉุกเฉิน
  // เปลี่ยนจากของเดิม ให้กลายเป็นเปิดหน้าจอ webglError.value = true
  canvasElement.value.addEventListener("webglcontextlost", (e) => { 
    e.preventDefault(); 
    console.warn("WebGL Context Lost!");
    webglError.value = true; // <--- โชว์ป้ายเตือนทันทีที่จอดำ
  }, false)
  canvasElement.value.addEventListener("webglcontextrestored", () => { if(camera) camera.start() }, false)

  loadP1Next(); loadP2Next()
  playBGM() 

  hands = new window.Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`})
  hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.6, minTrackingConfidence: 0.6 })
  hands.onResults(onResults)
  
  camera = new window.Camera(videoElement.value, { onFrame: async () => { if(videoElement.value) await hands.send({image: videoElement.value}) }, width: 640, height: 480, facingMode: 'user' })
  camera.start()
})

// 🔥 ล้าง AI ของเกมแข่งรถทิ้งตอนสลับหน้า
onUnmounted(async () => {
  stopBGM() 
  if (camera) { await camera.stop(); camera = null }
  // จุดสำคัญที่สุด: คืนโควต้า Memory 
  if (hands) { await hands.close(); hands = null } 
  if (canvasElement.value) { 
    const ctx = canvasElement.value.getContext('2d'); 
    if (ctx) ctx.clearRect(0, 0, canvasElement.value.width, canvasElement.value.height) 
  }
})
</script>

<style scoped>
.portrait-lock { display: none; }
@media screen and (orientation: portrait) and (max-width: 768px) { .portrait-lock { display: flex !important; } }

@keyframes engine-idle {
  0%, 100% { transform: translate(-50%, 0); }
  25% { transform: translate(calc(-50% - 1px), 1px); }
  50% { transform: translate(calc(-50% + 1px), -1px); }
  75% { transform: translate(calc(-50% - 1px), -1px); }
}
.animate-engine-idle { animation: engine-idle 0.1s infinite; }
</style>