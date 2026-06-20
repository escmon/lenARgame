<template>
  <div ref="gameContainer" class="relative w-full h-dvh overflow-hidden bg-slate-950 select-none font-sarabun">
    
    <video ref="videoElement" class="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none -z-10" autoplay playsinline></video>
    <canvas ref="canvasElement" class="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"></canvas>

    <div class="absolute top-0 inset-x-0 p-4 flex justify-between items-start z-10 pointer-events-none">
      <div class="bg-slate-900/80 px-6 py-2 rounded-2xl border-2 border-yellow-400 shadow-xl text-center pointer-events-auto">
        <p class="text-xs text-yellow-200 font-bold">คะแนน</p>
        <h2 class="text-3xl font-black text-white">{{ score }}</h2>
      </div>
      
      <div class="flex gap-2 md:gap-4 pointer-events-auto items-center">
        <button @click="skipQuestion" class="bg-slate-900/80 px-4 py-2 rounded-2xl border border-white/20 text-yellow-400 font-bold shadow-xl hover:bg-slate-800 transition-colors flex items-center gap-2">
          <span>⏭️</span> ข้าม
        </button>
        <button @click="toggleFullScreen" class="bg-slate-900/80 px-4 py-2 rounded-2xl border border-white/20 text-white shadow-xl hover:bg-slate-800 transition-colors text-xl">
          🔲
        </button>
        <button @click="$emit('back-to-menu')" class="bg-slate-900/80 px-6 py-2 rounded-2xl border border-white/20 text-white font-bold shadow-xl hover:bg-red-900 hover:border-red-500 transition-colors">
          ออก
        </button>
      </div>
    </div>

    <div class="absolute top-20 md:top-24 inset-x-0 flex justify-center z-10 pointer-events-none px-4">
      <div class="bg-slate-900/90 px-6 md:px-12 py-3 md:py-4 rounded-2xl border-2 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.5)] text-center animate-fade-in transition-all">
        <p class="text-xs md:text-sm text-cyan-300 font-bold mb-1 tracking-widest uppercase">โจทย์การจัดเรียง</p>
        <h1 class="text-2xl md:text-4xl lg:text-5xl font-black text-white drop-shadow-lg">{{ currentQuestionText }}</h1>
      </div>
    </div>

    <div class="absolute top-1/2 -translate-y-1/2 inset-x-0 flex justify-center gap-4 md:gap-8 z-10 pointer-events-none px-4 mt-8 md:mt-12">
      <div v-for="(zone, index) in 4" :key="'zone-'+index" :id="'drop-zone-'+index"
           class="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 border-4 border-dashed rounded-2xl md:rounded-3xl flex flex-col items-center justify-center transition-all duration-300"
           :class="placedItems[index] ? 'border-green-400 bg-green-400/20' : 'border-white/40 bg-black/40'">
        
        <div v-if="placedItems[index]" class="w-full h-full flex items-center justify-center p-2 animate-bounce">
          <img v-if="placedItems[index].type === 'image'" :src="placedItems[index].src" class="w-full h-full object-contain drop-shadow-lg" :style="{ transform: `scale(${placedItems[index].scale})` }" />
          <span v-else class="text-4xl md:text-6xl font-black text-white drop-shadow-lg">{{ placedItems[index].content }}</span>
        </div>
        
        <span v-else class="text-white/20 text-4xl md:text-6xl font-black">{{ index + 1 }}</span>
      </div>
    </div>

    <div id="choices-layer" class="absolute inset-0 pointer-events-none z-20">
      <div v-for="(item, index) in currentItems" :key="'choice-'+item.id" :id="'choice-'+index"
           class="absolute rounded-2xl flex items-center justify-center transition-transform duration-200"
           :class="[
             item.isDragging ? 'scale-125 z-50 drop-shadow-[0_0_30px_rgba(34,211,238,0.8)]' : 'scale-100 z-20',
             item.type === 'text' ? 'bg-slate-800 border-2 border-cyan-400 shadow-lg' : 'bg-transparent'
           ]"
           :style="{ left: item.x + 'px', top: item.y + 'px', width: boxSize+'px', height: boxSize+'px', transition: item.isDragging ? 'none' : 'all 0.4s ease', display: item.isPlaced ? 'none' : 'flex' }">
        
        <img v-if="item.type === 'image'" :src="item.src" class="w-full h-full object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.6)]" :style="{ transform: `scale(${item.scale})` }" draggable="false" />
        
        <span v-else class="text-4xl md:text-6xl font-black text-white">{{ item.content }}</span>
      </div>
    </div>

    <div v-if="showLevelComplete" class="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
       <h1 class="text-6xl md:text-8xl font-black text-yellow-400 animate-bounce drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]">ยอดเยี่ยม! 🌟</h1>
    </div>

    <div v-if="webglError" class="absolute inset-0 z-1000 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center pointer-events-auto backdrop-blur-sm">
      <div class="text-7xl mb-6 animate-bounce">⚠️</div>
      <h2 class="text-3xl md:text-5xl font-black text-red-500 mb-4">หน่วยความจำกล้องเต็ม</h2>
      <p class="text-slate-300 text-lg md:text-2xl mb-8">ระบบตรวจพบอาการจอดำ<br>กรุณากดปุ่มด้านล่างเพื่อล้างแคชครับ</p>
      <button @click="clearCache" class="px-10 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-2xl font-bold shadow-[0_0_30px_rgba(220,38,38,0.6)] transition-all cursor-pointer">
        🛠️ ล้างแคชและรีสตาร์ท
      </button>
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
const webglError = ref(false)
const showLevelComplete = ref(false)
let isTransitioning = false

let camera = null
let hands = null
let grabbedIndex = null
let isHandGrabbing = false

const boxSize = window.innerWidth < 768 ? 70 : 100 

const currentItems = ref([])
const placedItems = ref([null, null, null, null])
const currentQuestionText = ref('') // ข้อความโจทย์

const githubBaseUrl = "https://raw.githubusercontent.com/escmon/lenARgame/main/public/images"
const imageDatabase = {
  "animals": ["dog.png", "cat.png", "bird.png", "elephant.png"],
  "fruits": ["apple.png", "banana.png", "orange.png", "mango.png"]
}
const getImageUrl = (folder, filename) => `${githubBaseUrl}/${folder}/${encodeURIComponent(filename)}`

// แปลงตัวเลขอารบิกเป็นเลขไทย
const toThaiNum = (num) => num.toString().replace(/\d/g, d => '๐๑๒๓๔๕๖๗๘๙'[d])

// กำหนดโหมดของโจทย์ทั้งหมด
const gameModes = [
  { id: 'size_asc', q: 'เรียงภาพจาก เล็ก ➡️ ใหญ่' },
  { id: 'size_desc', q: 'เรียงภาพจาก ใหญ่ ➡️ เล็ก' },
  { id: 'num_th_asc', q: 'เรียงเลขไทยจาก น้อย ➡️ มาก' },
  { id: 'num_th_desc', q: 'เรียงเลขไทยจาก มาก ➡️ น้อย' },
  { id: 'num_ar_asc', q: 'เรียงตัวเลขจาก น้อย ➡️ มาก' },
  { id: 'num_ar_desc', q: 'เรียงตัวเลขจาก มาก ➡️ น้อย' }
]

const toggleFullScreen = () => {
  const elem = gameContainer.value || document.documentElement;
  if (!document.fullscreenElement) elem.requestFullscreen().catch(err => console.log(err));
  else if (document.exitFullscreen) document.exitFullscreen();
}

const clearCache = () => { window.location.reload(); }

const skipQuestion = () => {
  if (isTransitioning) return;
  loadNextQuestion();
}

const loadNextQuestion = () => {
  placedItems.value = [null, null, null, null]
  
  // สุ่มโหมดกติกาการเล่น
  const mode = gameModes[Math.floor(Math.random() * gameModes.length)]
  currentQuestionText.value = mode.q
  
  let items = []
  
  // โหมดเกี่ยวกับรูปภาพและขนาด
  if (mode.id.startsWith('size')) {
    const categories = Object.keys(imageDatabase)
    const selectedCategory = categories[Math.floor(Math.random() * categories.length)]
    const images = imageDatabase[selectedCategory]
    const selectedImage = images[Math.floor(Math.random() * images.length)] // สุ่มมา 1 รูปที่จะใช้
    const imgSrc = getImageUrl(selectedCategory, selectedImage)
    
    // ตั้งค่าสเกลจำลองขนาด (เรียงจากเล็กไปใหญ่ 50%, 75%, 100%, 130%)
    const sizes = [0.5, 0.75, 1.0, 1.3]
    let sortedSizes = [...sizes]
    if (mode.id === 'size_desc') sortedSizes.reverse() // ถ้ามากไปน้อย ให้กลับลำดับสเกลหลุมเป้าหมาย
    
    sizes.forEach((s, index) => {
      const correctIdx = sortedSizes.indexOf(s) // เช็คว่าสเกลนี้ควรลงหลุมไหน
      items.push({
        id: index, type: 'image', src: imgSrc, scale: s, content: '', correctIndex: correctIdx,
        isDragging: false, isPlaced: false, x: 0, y: 0, originalX: 0, originalY: 0
      })
    })
  } 
  // โหมดตัวเลข (อารบิกและไทย)
  else {
    let nums = []
    while(nums.length < 4) { // สุ่มเลข 1-99 4 ตัวไม่ซ้ำ
      const r = Math.floor(Math.random() * 99) + 1
      if(!nums.includes(r)) nums.push(r)
    }
    let sortedNums = [...nums].sort((a,b) => a-b)
    if (mode.id.endsWith('desc')) sortedNums.reverse()
    
    nums.forEach((n, index) => {
      const correctIdx = sortedNums.indexOf(n)
      const textVal = mode.id.includes('th') ? toThaiNum(n) : n // แปลงเป็นเลขไทยถ้าเป็นโหมดไทย
      items.push({
        id: index, type: 'text', src: null, scale: 1, content: textVal, correctIndex: correctIdx,
        isDragging: false, isPlaced: false, x: 0, y: 0, originalX: 0, originalY: 0
      })
    })
  }

  // สลับตำแหน่งกล่องให้กระจัดกระจาย
  items.sort(() => Math.random() - 0.5)
  currentItems.value = items

  setTimeout(() => {
    const w = window.innerWidth
    const h = window.innerHeight
    const spawnPositions = [
      { x: w * 0.20, y: h * 0.85 },
      { x: w * 0.40, y: h * 0.85 },
      { x: w * 0.60, y: h * 0.85 },
      { x: w * 0.80, y: h * 0.85 }
    ].sort(() => Math.random() - 0.5)

    currentItems.value.forEach((item, i) => {
      const offset = boxSize / 2
      item.x = spawnPositions[i].x - offset
      item.y = spawnPositions[i].y - offset
      item.originalX = item.x
      item.originalY = item.y
    })
  }, 100)
}

const checkWinCondition = () => {
  if (placedItems.value.every(item => item !== null)) {
    isTransitioning = true
    showLevelComplete.value = true
    if (window.confetti) window.confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } })
    setTimeout(() => {
      showLevelComplete.value = false
      isTransitioning = false
      loadNextQuestion()
    }, 3000)
  }
}

const isPointInRect = (px, py, rect) => (px >= rect.left && px <= rect.right && py >= rect.top && py <= rect.bottom)

const onResults = (results) => {
  if (webglError.value) return
  const canvas = canvasElement.value; if (!canvas) return
  const ctx = canvas.getContext('2d'); if (!ctx) return

  ctx.save()
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.translate(canvas.width, 0); ctx.scale(-1, 1)
  ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height)

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0 && !isTransitioning) {
    const landmarks = results.multiHandLandmarks[0]
    const indexTip = landmarks[8], thumb = landmarks[4]
    
    const curX = canvas.width * (1 - indexTip.x)
    const curY = canvas.height * indexTip.y
    const dist = Math.hypot(curX - (canvas.width * (1 - thumb.x)), curY - (canvas.height * thumb.y))
    
    const grabThresh = canvas.width < 768 ? 35 : 45
    const relThresh = canvas.width < 768 ? 65 : 85

    if (grabbedIndex === null) { isHandGrabbing = dist < grabThresh } 
    else { isHandGrabbing = dist <= relThresh }

    ctx.beginPath(); ctx.arc(indexTip.x * canvas.width, indexTip.y * canvas.height, 12, 0, 2*Math.PI)
    ctx.fillStyle = isHandGrabbing ? '#4ade80' : '#facc15'; ctx.fill()

    if (isHandGrabbing) {
      if (grabbedIndex === null) {
        for (let i = 0; i < 4; i++) {
          const item = currentItems.value[i]
          if (!item.isPlaced) { 
            const el = document.getElementById(`choice-${i}`)
            if (el && isPointInRect(curX, curY, el.getBoundingClientRect())) {
              grabbedIndex = i; item.isDragging = true; playGrab(); break
            }
          }
        }
      } else {
        const item = currentItems.value[grabbedIndex]
        if (item) {
          item.x = curX - (boxSize / 2)
          item.y = curY - (boxSize / 2)
          
          for (let i = 0; i < 4; i++) {
            const zoneEl = document.getElementById(`drop-zone-${i}`)
            if (zoneEl && isPointInRect(curX, curY, zoneEl.getBoundingClientRect())) {
              
              if (item.correctIndex === i) {
                item.isPlaced = true
                placedItems.value[i] = item
                score.value += 10
                playCorrect()
                grabbedIndex = null
                item.isDragging = false
                checkWinCondition() 
              } else {
                playWrong()
                item.x = item.originalX
                item.y = item.originalY
                grabbedIndex = null
                item.isDragging = false
              }
              break
            }
          }
        }
      }
    } else if (grabbedIndex !== null) {
      const item = currentItems.value[grabbedIndex]
      if (item) { item.isDragging = false; item.x = item.originalX; item.y = item.originalY }
      grabbedIndex = null
    }
  }
  ctx.restore()
}

onMounted(() => {
  canvasElement.value.width = window.innerWidth; canvasElement.value.height = window.innerHeight
  window.addEventListener('resize', () => { if(canvasElement.value) { canvasElement.value.width = window.innerWidth; canvasElement.value.height = window.innerHeight } })
  
  canvasElement.value.addEventListener("webglcontextlost", (e) => { e.preventDefault(); console.warn("WebGL Lost!"); webglError.value = true; }, false)
  canvasElement.value.addEventListener("webglcontextrestored", () => { if(camera) camera.start() }, false)

  loadNextQuestion()

  hands = new window.Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`})
  hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.6, minTrackingConfidence: 0.6 })
  hands.onResults(onResults)
  
  camera = new window.Camera(videoElement.value, { onFrame: async () => { if(videoElement.value && !webglError.value) await hands.send({image: videoElement.value}) }, width: 640, height: 480, facingMode: 'user' })
  camera.start()
})

onUnmounted(async () => {
  if (camera) { await camera.stop(); camera = null }
  if (hands) { await hands.close(); hands = null }
  if (canvasElement.value) { const ctx = canvasElement.value.getContext('2d'); if (ctx) ctx.clearRect(0, 0, canvasElement.value.width, canvasElement.value.height) }
})
</script>