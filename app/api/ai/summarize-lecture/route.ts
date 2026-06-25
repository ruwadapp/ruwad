import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 })
  }

  const { lectureId } = await req.json()
  if (!lectureId) {
    return NextResponse.json({ error: 'lectureId مطلوب' }, { status: 400 })
  }

  // جلب المحاضرة — RLS يضمن أن المستخدم مخوّل برؤيتها فعلياً (طالب مسجَّل أو المدرب المالك)
  const { data: lecture, error: lectureError } = await supabase
    .from('lectures')
    .select('id, title, content, description, ai_summary')
    .eq('id', lectureId)
    .single()

  if (lectureError || !lecture) {
    return NextResponse.json({ error: 'المحاضرة غير موجودة أو لا تملك صلاحية الوصول لها' }, { status: 404 })
  }

  // إن كان التلخيص محفوظاً مسبقاً، أعِده فوراً بدون أي استدعاء جديد للذكاء الاصطناعي
  if (lecture.ai_summary) {
    return NextResponse.json({ summary: lecture.ai_summary, cached: true })
  }

  const textToSummarize = lecture.content || lecture.description
  if (!textToSummarize || textToSummarize.trim().length < 30) {
    return NextResponse.json({ error: 'لا يوجد محتوى نصي كافٍ في هذه المحاضرة لتلخيصه' }, { status: 400 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ميزة التلخيص غير مفعّلة بعد — لم يُضبط مفتاح GEMINI_API_KEY في إعدادات الخادم' },
      { status: 503 }
    )
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `لخّص محتوى هذه المحاضرة التعليمية باللغة العربية في نقاط واضحة ومركّزة (4-6 نقاط كحد أقصى)، بأسلوب يساعد الطالب على المراجعة السريعة. لا تضف أي مقدمة أو خاتمة، اكتب النقاط مباشرة فقط.\n\nعنوان المحاضرة: ${lecture.title}\n\nالمحتوى:\n${textToSummarize}`,
                },
              ],
            },
          ],
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error('Gemini API error:', errText)
      return NextResponse.json({ error: 'حدث خطأ من خدمة الذكاء الاصطناعي، حاول مرة أخرى لاحقاً' }, { status: 502 })
    }

    const data = await response.json()
    const summary: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!summary) {
      return NextResponse.json({ error: 'تعذّر توليد التلخيص، حاول مرة أخرى' }, { status: 502 })
    }

    await supabase.from('lectures').update({ ai_summary: summary.trim() }).eq('id', lectureId)

    return NextResponse.json({ summary: summary.trim(), cached: false })
  } catch (err) {
    console.error('Summarize lecture error:', err)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 })
  }
}
