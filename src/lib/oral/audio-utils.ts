/**
 * Utilitaires audio pour l'atelier oral.
 * Ces fonctions sont des wrappers purs (pas de state React).
 */

export function speakText(text: string): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'fr-FR';
  const synth = window.speechSynthesis;
  const voices = synth.getVoices();
  const preferred =
    voices.find(
      (voice) =>
        voice.lang.toLowerCase().startsWith('fr') &&
        voice.name.toLowerCase().includes('google'),
    ) ?? voices.find((voice) => voice.lang.toLowerCase().startsWith('fr'));
  if (preferred) {
    utterance.voice = preferred;
  }
  synth.speak(utterance);
}

export function speakTextSafe(text: string): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    speakText(text);
  }
}

export function playAudioBase64(base64: string, mimeType: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
      }
      const blob = new Blob([bytes], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Lecture audio impossible.'));
      };
      audio.play().catch(reject);
    } catch (error) {
      reject(error);
    }
  });
}
