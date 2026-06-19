// ประกาศตัวแปรนอกฟังก์ชันเพื่อให้ใช้ร่วมกันได้และไม่สร้างซ้ำ (ป้องกันแอปค้าง)
let audioCtx = null;
let bgOsc = null;
let isMuted = false;
let bgmInterval = null;

export function useAudio() {
  const initAudio = () => {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  const playTone = (freq, type, duration) => {
    if (isMuted) return;
    initAudio();
    if (!audioCtx) return;

    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime); // ความดังเอฟเฟกต์
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.log("Audio play error:", e);
    }
  }

  // เสียง SFX ต่างๆ
  const playGrab = () => playTone(600, 'sine', 0.1)
  const playCorrect = () => { playTone(523.25, 'sine', 0.1); setTimeout(() => playTone(659.25, 'sine', 0.2), 100) }
  const playWrong = () => playTone(150, 'sawtooth', 0.3)
  const playTimeout = () => playTone(100, 'square', 0.5)
  
  // เสียงตอนเข้าเส้นชัย (โน้ต 3 ตัวติดกัน)
  const playWin = () => { 
    playTone(523.25, 'sine', 0.1); 
    setTimeout(() => playTone(659.25, 'sine', 0.1), 100); 
    setTimeout(() => playTone(783.99, 'sine', 0.4), 200); 
  }

  // ดนตรีประกอบพื้นหลัง (เสียงกระหึ่มคล้ายเครื่องยนต์รถแข่ง)
  const playBGM = () => {
    if (isMuted || bgOsc) return; 
    initAudio();
    if (!audioCtx) return;

    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      gain.gain.value = 0.05; // เปิดเบาๆ เป็น Background
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      bgOsc = { osc, gain };

      // ลูปเสียงต่ำสลับกันสร้างจังหวะบีท
      let t = audioCtx.currentTime;
      const notes = [110, 110, 146, 110]; 
      bgmInterval = setInterval(() => {
        if (isMuted || !audioCtx) return;
        let t2 = audioCtx.currentTime;
        notes.forEach((n, i) => { osc.frequency.setValueAtTime(n, t2 + i * 0.25); });
      }, 1000);
    } catch (e) { console.log("BGM error:", e); }
  }

  // ปิดดนตรีประกอบ
  const stopBGM = () => {
    if (bgOsc) {
      try { bgOsc.osc.stop(); } catch(e){}
      bgOsc = null;
    }
    if (bgmInterval) {
      clearInterval(bgmInterval);
      bgmInterval = null;
    }
  }

  // สลับการเปิด/ปิดเสียง
  const toggleMute = () => {
    isMuted = !isMuted;
    if (bgOsc) {
      bgOsc.gain.gain.value = isMuted ? 0 : 0.05;
    }
    return isMuted;
  }

  return { playGrab, playCorrect, playWrong, playTimeout, playWin, playBGM, stopBGM, toggleMute }
}