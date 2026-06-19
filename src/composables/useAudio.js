// src/composables/useAudio.js

export function useAudio() {
  // สร้าง AudioContext (รองรับทั้งบราวเซอร์ใหม่และเก่า)
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)()

  // ฟังก์ชันหลักในการสร้างคลื่นเสียง
  const playTone = (freq, type = 'sine', duration = 0.1, volume = 0.1) => {
    // บราวเซอร์มักจะระงับเสียงไว้จนกว่าผู้ใช้จะคลิกหน้าเว็บ ต้องสั่ง resume ก่อน
    if (audioCtx.state === 'suspended') {
      audioCtx.resume()
    }
    
    const oscillator = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()
    
    oscillator.type = type
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime)
    
    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime)
    // ลดเสียงลงเรื่อยๆ จนเงียบ (ป้องกันเสียงแตกตอนจบคลื่น)
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration)
    
    oscillator.connect(gainNode)
    gainNode.connect(audioCtx.destination)
    
    oscillator.start()
    oscillator.stop(audioCtx.currentTime + duration)
  }

  // --- ชุดคลังเสียงสำหรับเกม ---

  // 1. เสียงตอนจีบนิ้วจับคำตอบ (เสียงสั้นๆ ใสๆ)
  const playGrab = () => {
    playTone(600, 'sine', 0.1, 0.1)
  }

  // 2. เสียงตอนตอบถูก (เสียง ติ๊ง-ต่อง 2 จังหวะ)
  const playCorrect = () => {
    playTone(523.25, 'square', 0.1, 0.1) // โน้ต C5
    setTimeout(() => {
      playTone(659.25, 'square', 0.2, 0.1) // โน้ต E5
    }, 100)
  }

  // 3. เสียงตอนตอบผิด (เสียงต่ำๆ แป๊กๆ)
  const playWrong = () => {
    playTone(250, 'triangle', 0.3, 0.2)
  }

  // 4. เสียงตอนหมดเวลา หรือ Game Over (เสียงเตือนยาว)
  const playTimeout = () => {
    playTone(220, 'sawtooth', 1.5, 0.15)
  }

  // ส่งออกฟังก์ชันไปให้คอมโพเนนต์อื่นเรียกใช้
  return {
    playGrab,
    playCorrect,
    playWrong,
    playTimeout
  }
}