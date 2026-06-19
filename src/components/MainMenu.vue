<template>
  <div class="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-radial from-slate-900 via-indigo-950 to-slate-950 select-none">
    
    <div class="text-center mb-12">
      <h1 class="text-6xl font-black tracking-wider text-transparent bg-clip-text bg-linear-to-r from-cyan-400 via-blue-500 to-indigo-400 drop-shadow-md">
        LENLENREAN AR
      </h1>
      <p class="text-slate-400 text-lg mt-2 font-medium">
        ยินดีต้อนรับคุณครูและนักเรียนเข้าสู่ระบบเกม AR อัจฉริยะครับ
      </p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl w-full px-4">
      <button 
        v-for="sub in subjects" 
        :key="sub.id"
        @click="openGradeModal(sub.id, sub.title)"
        :class="[
          'p-6 rounded-2xl border text-left bg-slate-900/60 backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 group cursor-pointer',
          sub.borderColor, sub.textColor, sub.hoverBorder
        ]"
      >
        <div class="text-4xl mb-3 group-hover:animate-bounce">{{ sub.icon }}</div>
        <div class="text-2xl font-bold">{{ sub.title }}</div>
        <div class="text-xs text-slate-400 mt-1 font-medium">คลิกเพื่อเข้าสู่บทเรียน</div>
      </button>
    </div>

    <div v-if="showModal" class="fixed inset-0 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm z-50 animate-fade-in">
      <div class="bg-slate-900/90 border border-slate-700/60 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl">
        <div class="text-sm text-cyan-400 font-bold uppercase tracking-widest mb-1">หมวดหมู่</div>
        <h3 class="text-3xl font-black text-white mb-6">{{ activeSubjectTitle }}</h3>
        
        <div v-if="modalStep === 1" class="flex flex-col space-y-4">
          <p class="text-slate-300 text-sm font-bold mb-2">เลือกระดับชั้น:</p>
          <button @click="selectGrade('kindergarten')" class="w-full py-3 bg-pink-600 hover:bg-pink-500 active:scale-98 text-white text-xl font-bold rounded-xl transition-all shadow-md cursor-pointer">
            🧒 อนุบาล
          </button>
          <button @click="selectGrade('primary')" class="w-full py-3 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white text-xl font-bold rounded-xl transition-all shadow-md cursor-pointer">
            👦 ประถมศึกษา
          </button>
          <button @click="selectGrade('secondary')" class="w-full py-3 bg-purple-600 hover:bg-purple-500 active:scale-98 text-white text-xl font-bold rounded-xl transition-all shadow-md cursor-pointer">
            👨‍🎓 มัธยมศึกษา
          </button>
          
          <button v-if="activeSubjectId === 'english'" @click="selectVocabMode" class="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white text-xl font-bold rounded-xl transition-all shadow-md cursor-pointer border border-indigo-400">
            🖼️ โหมดจับคู่ภาพคำศัพท์ (รวม)
          </button>

          <button @click="$emit('start-racing')" class="w-full py-3 mt-2 bg-orange-500 hover:bg-orange-400 active:scale-98 text-white text-xl font-bold rounded-xl transition-all shadow-md cursor-pointer border border-orange-300">
            🚗 Racing | Fast เร็วทะลุจอ
          </button>

          <button @click="$emit('start-sorting')" class="w-full py-3 mt-2 bg-orange-500 hover:bg-orange-400 active:scale-98 text-white text-xl font-bold rounded-xl transition-all shadow-md cursor-pointer border border-orange-300">
            🧩 โหมดเรียงลำดับ (น้อย-มาก / เล็ก-ใหญ่)
          </button>
          <button @click="closeModal" class="pt-2 text-slate-400 hover:text-white text-sm font-medium transition-colors cursor-pointer">ยกเลิก</button>
        </div>

        <div v-else-if="modalStep === 2" class="flex flex-col space-y-4">
          <p class="text-slate-300 text-sm font-bold mb-2">เลือกระดับความยาก:</p>
          <button @click="startGame('easy')" class="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white text-xl font-bold rounded-xl transition-all shadow-md cursor-pointer">😊 ง่าย</button>
          <button @click="startGame('medium')" class="w-full py-3 bg-amber-600 hover:bg-amber-500 active:scale-98 text-white text-xl font-bold rounded-xl transition-all shadow-md cursor-pointer">🤔 ปานกลาง</button>
          <button @click="startGame('hard')" class="w-full py-3 bg-rose-600 hover:bg-rose-500 active:scale-98 text-white text-xl font-bold rounded-xl transition-all shadow-md cursor-pointer">🔥 ยาก</button>
          <button @click="modalStep = 1" class="pt-2 text-slate-400 hover:text-white text-sm font-medium transition-colors cursor-pointer">ย้อนกลับ</button>
        </div>

        <div v-else-if="modalStep === 3" class="flex flex-col space-y-4 text-left">
          <label class="block text-slate-300 text-sm font-bold mb-1">เลือกบทเรียนที่ต้องการทบทวน:</label>
          <select v-model="selectedLesson" class="w-full p-3 rounded-xl bg-slate-800 text-white border border-slate-600 focus:border-cyan-400 focus:outline-none cursor-pointer">
            <option value="all">📚 สุ่มทั้งหมด (264 คำ)</option>
            <option v-for="i in 33" :key="i" :value="i">📖 บทเรียนที่ {{ i }}</option>
          </select>
          <button @click="startGame('vocab')" class="w-full py-3 mt-4 bg-cyan-600 hover:bg-cyan-500 active:scale-98 text-white text-xl font-bold rounded-xl transition-all shadow-md cursor-pointer">🚀 เริ่มเกมจับคู่</button>
          <button @click="modalStep = 1" class="pt-2 text-center text-slate-400 hover:text-white text-sm font-medium transition-colors cursor-pointer">ย้อนกลับ</button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['start-game'])

const showModal = ref(false)
const modalStep = ref(1)
const activeSubjectId = ref('')
const activeSubjectTitle = ref('')
const selectedGrade = ref('')
const selectedLesson = ref('all')

const subjects = [
  { id: 'math', title: 'คณิตศาสตร์', icon: '💻', textColor: 'text-cyan-400', borderColor: 'border-cyan-500/20', hoverBorder: 'hover:border-cyan-400' },
  { id: 'science', title: 'วิทยาศาสตร์', icon: '🚀', textColor: 'text-emerald-400', borderColor: 'border-emerald-500/20', hoverBorder: 'hover:border-emerald-400' },
  { id: 'thai', title: 'ภาษาไทย', icon: '🐘', textColor: 'text-orange-400', borderColor: 'border-orange-500/20', hoverBorder: 'hover:border-orange-400' },
  { id: 'english', title: 'ภาษาอังกฤษ', icon: '🇬🇧', textColor: 'text-pink-400', borderColor: 'border-pink-500/20', hoverBorder: 'hover:border-pink-400' },
  { id: 'computing', title: 'วิทยาการคำนวณ', icon: '🤖', textColor: 'text-purple-400', borderColor: 'border-purple-500/20', hoverBorder: 'hover:border-purple-400' },
  { id: 'gk', title: 'ความรู้รอบตัว', icon: '💡', textColor: 'text-yellow-400', borderColor: 'border-yellow-500/20', hoverBorder: 'hover:border-yellow-400' }
]

const openGradeModal = (id, title) => {
  activeSubjectId.value = id
  activeSubjectTitle.value = title
  modalStep.value = 1
  selectedLesson.value = 'all'
  showModal.value = true
}

const selectGrade = (grade) => {
  selectedGrade.value = grade
  modalStep.value = 2
}

const selectVocabMode = () => {
  selectedGrade.value = 'all'
  modalStep.value = 3
}

const closeModal = () => showModal.value = false

const startGame = (level) => {
  showModal.value = false
  emit('start-game', {
    subject: activeSubjectId.value,
    grade: selectedGrade.value,
    level: level,
    lesson: selectedLesson.value
  })
}
</script>