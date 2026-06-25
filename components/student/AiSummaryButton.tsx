'use client'
import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'

export function AiSummaryButton({ lectureId, initialSummary }: { lectureId: string; initialSummary: string | null }) {
  const [summary, setSummary] = useState(initialSummary)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/summarize-lecture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lectureId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'حدث خطأ غير متوقع')
        return
      }
      setSummary(data.summary)
    } catch {
      setError('تعذّر الاتصال بالخادم، تحقق من اتصالك بالإنترنت')
    } finally {
      setLoading(false)
    }
  }

  if (summary) {
    return (
      <div className="bg-ruwad-blue/5 border border-ruwad-blue/20 rounded-ruwad p-5 flex flex-col gap-2">
        <p className="flex items-center gap-1.5 text-sm font-bold text-ruwad-blue">
          <Sparkles size={16} /> تلخيص بالذكاء الاصطناعي
        </p>
        <div className="text-ruwad-navy/80 text-sm whitespace-pre-wrap leading-relaxed">{summary}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        onClick={generate}
        disabled={loading}
        className="flex items-center gap-1.5 text-sm font-semibold bg-ruwad-blue/10 text-ruwad-blue px-4 py-2 rounded-ruwad-sm hover:bg-ruwad-blue/20 transition disabled:opacity-50 w-fit"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
        {loading ? 'جارٍ التلخيص...' : 'تلخيص المحاضرة بالذكاء الاصطناعي'}
      </button>
    </div>
  )
}
