import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'رُوّاد — منصة تدريب تفاعلية بروح المسابقة'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

async function loadArabicFont(text: string, weight: number) {
  const cssUrl = `https://fonts.googleapis.com/css2?family=Cairo:wght@${weight}&text=${encodeURIComponent(text)}`
  const css = await (await fetch(cssUrl)).text()
  const match = css.match(/src: url\(([^)]+)\) format\('(?:opentype|truetype)'\)/)
  if (!match) throw new Error('تعذّر تحميل الخط العربي')
  const res = await fetch(match[1])
  return res.arrayBuffer()
}

export default async function OgImage() {
  const text = 'رُوّاد منصة تدريب عربية متكاملة تدريبك، بروح المسابقة ruwaad.app'
  const [regular, bold] = await Promise.all([loadArabicFont(text, 400), loadArabicFont(text, 800)])

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #252943 0%, #3A4EFB 100%)',
          position: 'relative',
          fontFamily: 'Cairo',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: 'rgba(227,255,59,0.25)',
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            background: 'rgba(255,255,255,0.12)',
            padding: '14px 30px',
            borderRadius: 999,
            marginBottom: 36,
          }}
        >
          <span style={{ color: '#E3FF3B', fontSize: 30 }}>✦</span>
          <span style={{ color: 'white', fontSize: 28, fontWeight: 700 }}>منصة تدريب عربية متكاملة</span>
        </div>
        <div style={{ display: 'flex', color: 'white', fontSize: 96, fontWeight: 800 }}>تدريبك،</div>
        <div style={{ display: 'flex', color: '#E3FF3B', fontSize: 96, fontWeight: 800 }}>بروح المسابقة</div>
        <div style={{ display: 'flex', color: 'rgba(255,255,255,0.65)', fontSize: 30, marginTop: 30 }}>ruwaad.app</div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Cairo', data: regular, weight: 400, style: 'normal' },
        { name: 'Cairo', data: bold, weight: 800, style: 'normal' },
      ],
    },
  )
}
