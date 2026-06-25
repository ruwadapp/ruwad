'use client'
import { useState, useEffect, useRef } from 'react'
import { Volume2, Pause, Square } from 'lucide-react'

export function TextToSpeechButton({ text }: { text: string }) {
  const [supported, setSupported] = useState(true)
  const [speaking, setSpeaking] = useState(false)
  const [paused, setPaused] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window)
    return () => {
      if (typeof window !== 'undefined') window.speechSynthesis.cancel()
    }
  }, [])

  function pickArabicVoice() {
    const voices = window.speechSynthesis.getVoices()
    return (
      voices.find((v) => v.lang === 'ar-SA') ||
      voices.find((v) => v.lang.startsWith('ar')) ||
      null
    )
  }

  function start() {
    if (!text.trim()) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ar-SA'
    const voice = pickArabicVoice()
    if (voice) utterance.voice = voice
    utterance.rate = 0.95
    utterance.onend = () => { setSpeaking(false); setPaused(false) }
    utterance.onerror = () => { setSpeaking(false); setPaused(false) }
    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
    setSpeaking(true)
    setPaused(false)
  }

  function togglePause() {
    if (paused) {
      window.speechSynthesis.resume()
      setPaused(false)
    } else {
      window.speechSynthesis.pause()
      setPaused(true)
    }
  }

  function stop() {
    window.speechSynthesis.cancel()
    setSpeaking(false)
    setPaused(false)
  }

  if (!supported) return null

  return (
    <div className="flex items-center gap-2">
      {!speaking ? (
        <button
          onClick={start}
          className="flex items-center gap-1.5 text-sm font-semibold bg-ruwad-blue/10 text-ruwad-blue px-4 py-2 rounded-ruwad-sm hover:bg-ruwad-blue/20 transition"
        >
          <Volume2 size={16} /> استماع للمحاضرة
        </button>
      ) : (
        <>
          <button onClick={togglePause} className="flex items-center gap-1.5 text-sm font-semibold bg-ruwad-blue text-white px-4 py-2 rounded-ruwad-sm hover:opacity-90 transition">
            <Pause size={16} /> {paused ? 'استمرار' : 'إيقاف مؤقت'}
          </button>
          <button onClick={stop} aria-label="إيقاف" className="text-ruwad-navy/50 hover:bg-ruwad-gray/30 p-2 rounded-ruwad-sm transition">
            <Square size={16} />
          </button>
        </>
      )}
    </div>
  )
}
