// ไฟล์นี้ถูกทำเป็น "ฟังก์ชันว่างเปล่า" เพื่อปิดระบบเสียงทั้งหมดชั่วคราว
export function useAudio() {
  
  // ปล่อยว่างไว้ ไม่ต้องให้มีการเรียกใช้ Audio API ใดๆ ทั้งสิ้น
  const playGrab = () => {}
  const playCorrect = () => {}
  const playWrong = () => {}
  const playTimeout = () => {}

  return { playGrab, playCorrect, playWrong, playTimeout }
}