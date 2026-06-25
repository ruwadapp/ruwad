'use client'
import { useState, useEffect, useRef } from 'react'
import { Volume2, Pause, Square, AlertTriangle } from 'lucide-react'

export function TextToSpeechButton({ text }: { text: string }) {
  const [supported, setSupported] = useState(true)
  const [speaking, setSpeaking] = useState(false)
  const [paused, setPaused] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window)
    return () => {
      if (typeof window !== 'undefined') window.speechSynthesis.cancel()
      if (keepAliveRef.current) clearInterval(keepAliveRef.current)
    }
  }, [])

  function getVoicesAsync(): Promise<SpeechSynthesisVoice[]> {
    return new Promise((resolve) => {
      const existing = window.speechSynthesis.getVoices()
      if (existing.length > 0) {
        resolve(existing)
        return
      }
      const handler = () => {
        resolve(window.speechSynthesis.getVoices())
        window.speechSynthesis.removeEventListener('voiceschanged', handler)
      }
      window.speechSynthesis.addEventListener('voiceschanged', handler)
      // بعض المتصفحات لا تُطلق الحدث إطلاقاً — حدّ زمني احتياطي
      setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1000)
    })
  }

  async function start() {
    if (!text.trim()) return
    setNotice(null)
    window.speechSynthesis.cancel()

    const voices = await getVoicesAsync()
    const arabicVoice =
      voices.find((v) => v.lang === 'ar-SA') ||
      voices.find((v) => v.lang.startsWith('ar')) ||
      null

    const utterance = new SpeechSynthesisUtterance(text)

    if (arabicVoice) {
      utterance.voice = arabicVoice
      utterance.lang = arabicVoice.lang
    } else if (voices.length > 0) {
      // لا يوجد صوت عربي مثبَّت على هذا الجهاز — نستخدم أي صوت متاح حتى لا يفشل التشغيل بصمت
      utterance.voice = voices[0]
      utterance.lang = voices[0].lang
      setNotice('لا يوجد صوت عربي مثبَّت على جهازك، سيُستخدم صوت بديل (قد يقرأ بنطق غير عربي).')
    } else {
      setNotice('لم يتمكّن المتصفح من تحميل أي صوت. جرّب متصفحاً آخر (Chrome يعمل بشكل أفضل عادة).')
      return
    }

    utterance.rate = 0.95
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => { setSpeaking(false); setPaused(false); stopKeepAlive() }
    utterance.onerror = () => {
      setSpeaking(false); setPaused(false); stopKeepAlive()
      setNotice('تعذّر تشغيل الصوت على هذا الجهاز.')
    }
    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
    setSpeaking(true)
    setPaused(false)
    startKeepAlive()
  }

  // معالجة خلل معروف في Chrome يوقف القراءة تلقائياً بعد ~15 ثانية للنصوص الطويلة
  function startKeepAlive() {
    stopKeepAlive()
    keepAliveRef.current = setInterval(() => {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause()
        window.speechSynthesis.resume()
      }
    }, 10000)
  }
  function stopKeepAlive() {
    if (keepAliveRef.current) { clearInterval(keepAliveRef.current); keepAliveRef.current = null }
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
    stopKeepAlive()
  }

  if (!supported) return null

  return (
    <div className="flex flex-col gap-2">
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
      {notice && (
        <p className="flex items-center gap-1.5 text-xs text-amber-600">
          <AlertTriangle size={13} /> {notice}
        </p>
      )}
    </div>
  )
}
