export function useAudio() {
  const playTone = (freq, type, duration) => {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    
    osc.type = type
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    gain.gain.setValueAtTime(0.1, ctx.currentTime) // ความดัง
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  }

  // เสียงตอนกำมือหยิบ
  const playGrab = () => playTone(600, 'sine', 0.1)
  
  // เสียงตอบถูก (ตี๊-ติ๊ง!)
  const playCorrect = () => {
    playTone(523.25, 'sine', 0.1) 
    setTimeout(() => playTone(659.25, 'sine', 0.2), 100) 
  }
  
  // เสียงตอบผิด (แป๊ด!)
  const playWrong = () => playTone(150, 'sawtooth', 0.3)
  
  // เสียงหมดเวลา
  const playTimeout = () => playTone(100, 'square', 0.5)

  return { playGrab, playCorrect, playWrong, playTimeout }
}