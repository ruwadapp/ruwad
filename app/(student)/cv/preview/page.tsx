import { redirect } from 'next/navigation'
import QRCode from 'qrcode'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { PrintReportButton } from '@/components/shared/PrintReportButton'
import type { CVData } from '@/lib/cv'
import { CV_LABELS } from '@/lib/cv'

export const dynamic = 'force-dynamic'

const BLUE = '#3A4EFB'
const BLUE_LIGHT = '#33A4FA'
const LIME = '#E3FF3B'
const NAVY = '#252943'
const GRAY = '#DEE0ED'

// ============================================================================
// معاينة السيرة الذاتية — صفحة A4 بهوية رُوّاد قابلة للتحميل PDF
// الشهادات الموثّقة من رُوّاد تُضاف تلقائياً مع رموز QR للتحقق الفوري.
// ============================================================================
export default async function CVPreviewPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: certificates }] = await Promise.all([
    supabase.from('profiles').select('full_name, avatar_url, skills, cv_data').eq('id', user.id).single(),
    supabase.from('certificates').select('id, score, certificate_code, issued_at, course:courses(title)').eq('student_id', user.id).order('issued_at', { ascending: false }),
  ])
  if (!profile) redirect('/login')

  const cv = (profile.cv_data ?? {}) as CVData
  const lang: 'ar' | 'en' = cv.lang === 'en' ? 'en' : 'ar'
  const L = CV_LABELS[lang]
  const dir = lang === 'ar' ? 'rtl' : 'ltr'
  const skills = (profile.skills ?? []) as string[]

  // رموز QR للتحقق من الشهادات (data URLs مولّدة على الخادم)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.ruwaad.app'
  const certsWithQr = await Promise.all(
    (certificates ?? []).map(async (c) => ({
      ...c,
      qr: await QRCode.toDataURL(`${baseUrl}/certificates/verify/${c.certificate_code}`, {
        margin: 1,
        width: 120,
        color: { dark: NAVY, light: '#FFFFFF' },
      }),
    }))
  )

  const range = (start?: string, end?: string) =>
    [start, end || L.present].filter(Boolean).join(' — ')

  const has = {
    summary: !!cv.summary?.trim(),
    education: (cv.education ?? []).some((e) => e.degree || e.institution),
    skills: skills.length > 0,
    work: (cv.work ?? []).some((w) => w.position || w.org),
    trainings: (cv.trainings ?? []).some((t) => t.title),
    certs: certsWithQr.length > 0,
    languages: (cv.languages ?? []).some((l) => l.name),
    references: (cv.references ?? []).some((r) => r.name),
  }

  return (
    <div dir={dir} lang={lang} className="cv-root" style={{ background: '#EEF0F7', minHeight: '100vh' }}>
      <style>{`
        @media print {
          .no-print, nav, aside, [class*="fixed"] { display: none !important; }
          html, body { height: auto !important; min-height: 0 !important; overflow: visible !important; }
          .cv-root { min-height: 0 !important; background: #fff !important; }
          .cv-sheet > div:last-child { padding-bottom: 0 !important; }
          .cv-sheet section:last-of-type, .cv-sheet > div:last-child > div:last-child { margin-bottom: 0 !important; page-break-after: avoid; }
          body, html { background: #fff !important; }
          .cv-sheet { box-shadow: none !important; margin: 0 !important; max-width: none !important; border-radius: 0 !important; }
          .cv-sheet { padding-bottom: 8mm; }
          .avoid-break { break-inside: avoid; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        @page { size: A4; margin: 0; }
        section { break-inside: auto; }
        .cv-h2 { break-after: avoid; display: flex; align-items: center; gap: 8px; color: ${NAVY}; font-size: 14px; font-weight: 800; letter-spacing: .3px; margin: 0 0 12px; }
        .cv-h2::before { content: ''; width: 4px; height: 16px; background: ${BLUE}; border-radius: 4px; display: inline-block; }
        .cv-chip { display: inline-block; background: ${BLUE}14; color: ${BLUE}; font-size: 11.5px; font-weight: 700; border-radius: 999px; padding: 4px 12px; }
      `}</style>

      <PrintReportButton />

      <div className="cv-sheet" style={{ maxWidth: 820, margin: '24px auto', background: '#fff', borderRadius: 20, boxShadow: '0 8px 32px rgba(58,78,251,.12)', overflow: 'hidden' }}>
        {/* ===== الترويسة ===== */}
        <div style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_LIGHT} 100%)`, padding: '30px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ color: '#fff', fontSize: 27, fontWeight: 900, margin: 0 }}>{profile.full_name}</h1>
            {cv.title && <p style={{ color: LIME, fontSize: 15, fontWeight: 700, margin: '6px 0 0' }}>{cv.title}</p>}
            <p style={{ color: 'rgba(255,255,255,.85)', fontSize: 12, margin: '8px 0 0', direction: 'ltr', textAlign: dir === 'rtl' ? 'right' : 'left' }}>
              {[cv.email, cv.phone].filter(Boolean).join('  ·  ')}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            {profile.avatar_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" style={{ width: 74, height: 74, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,.5)' }} />
            )}
            <div style={{ background: LIME, color: NAVY, fontWeight: 900, fontSize: 17, padding: '9px 15px', borderRadius: 13 }}>رُوّاد</div>
          </div>
        </div>

        <div style={{ padding: '30px 40px', display: 'flex', flexDirection: 'column', gap: 30 }}>
          {/* النبذة */}
          {has.summary && (
            <section className="avoid-break">
              <h2 className="cv-h2">{L.summary}</h2>
              <p style={{ color: `${NAVY}CC`, fontSize: 13, lineHeight: 1.8, margin: 0 }}>{cv.summary}</p>
            </section>
          )}

          {/* التحصيل العلمي */}
          {has.education && (
            <section >
              <h2 className="cv-h2">{L.education}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(cv.education ?? []).filter((e) => e.degree || e.institution).map((e, i) => (
                  <div key={i} className="avoid-break" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, borderRight: dir === 'rtl' ? `2px solid ${GRAY}` : undefined, borderLeft: dir === 'ltr' ? `2px solid ${GRAY}` : undefined, padding: dir === 'rtl' ? '2px 12px 2px 0' : '2px 0 2px 12px' }}>
                    <div>
                      <p style={{ fontWeight: 800, color: NAVY, fontSize: 13.5, margin: 0 }}>{e.degree}</p>
                      <p style={{ color: `${NAVY}99`, fontSize: 12, margin: '3px 0 0' }}>{e.institution}</p>
                    </div>
                    <span style={{ color: BLUE, fontSize: 11.5, fontWeight: 700, whiteSpace: 'nowrap' }}>{range(e.start, e.end)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* المهارات */}
          {has.skills && (
            <section className="avoid-break">
              <h2 className="cv-h2">{L.skills}</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {skills.map((s) => <span key={s} className="cv-chip">{s}</span>)}
              </div>
            </section>
          )}

          {/* الخبرة العملية */}
          {has.work && (
            <section >
              <h2 className="cv-h2">{L.work}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {(cv.work ?? []).filter((w) => w.position || w.org).map((w, i) => (
                  <div key={i} className="avoid-break">
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <p style={{ fontWeight: 800, color: NAVY, fontSize: 13.5, margin: 0 }}>
                        {w.position}{w.org ? <span style={{ color: `${NAVY}99`, fontWeight: 600 }}> — {w.org}</span> : null}
                      </p>
                      <span style={{ color: BLUE, fontSize: 11.5, fontWeight: 700, whiteSpace: 'nowrap' }}>{range(w.start, w.end)}</span>
                    </div>
                    {w.description && <p style={{ color: `${NAVY}AA`, fontSize: 12, lineHeight: 1.7, margin: '5px 0 0' }}>{w.description}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* شهادات رُوّاد الموثّقة + QR */}
          {has.certs && (
            <section >
              <h2 className="cv-h2">{L.ruwadCerts}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {certsWithQr.map((c) => (
                  <div key={c.id} className="avoid-break" style={{ display: 'flex', alignItems: 'center', gap: 12, border: `1.5px solid ${LIME}`, background: `linear-gradient(135deg, ${LIME}22 0%, #fff 70%)`, borderRadius: 14, padding: '10px 12px' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.qr} alt="QR" style={{ width: 58, height: 58, borderRadius: 8, flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 800, color: NAVY, fontSize: 12.5, margin: 0 }}>{(c.course as unknown as { title?: string })?.title ?? 'شهادة إتمام'}</p>
                      <p style={{ color: `${NAVY}88`, fontSize: 11, margin: '3px 0 0' }}>
                        {L.score}: {c.score}% · {new Date(c.issued_at).toLocaleDateString(lang === 'ar' ? 'ar' : 'en-GB')}
                      </p>
                      <p style={{ color: BLUE, fontSize: 10, fontWeight: 700, margin: '3px 0 0' }}>✓ {L.scanToVerify}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* التدريبات الخارجية */}
          {has.trainings && (
            <section >
              <h2 className="cv-h2">{L.trainings}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(cv.trainings ?? []).filter((t) => t.title).map((t, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <p style={{ margin: 0, fontSize: 12.5, color: NAVY }}>
                      <span style={{ fontWeight: 800 }}>{t.title}</span>
                      {t.org ? <span style={{ color: `${NAVY}99` }}> — {t.org}</span> : null}
                    </p>
                    {t.year && <span style={{ color: BLUE, fontSize: 11.5, fontWeight: 700 }}>{t.year}</span>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* اللغات + المراجع جنباً إلى جنب */}
          {(has.languages || has.references) && (
            <section className="avoid-break" style={{ display: 'grid', gridTemplateColumns: has.languages && has.references ? '1fr 1fr' : '1fr', gap: 24 }}>
              {has.languages && (
                <div>
                  <h2 className="cv-h2">{L.languages}</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(cv.languages ?? []).filter((l) => l.name).map((l, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                        <span style={{ fontWeight: 700, color: NAVY }}>{l.name}</span>
                        <span style={{ color: `${NAVY}88` }}>{l.level}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {has.references && (
                <div>
                  <h2 className="cv-h2">{L.references}</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(cv.references ?? []).filter((r) => r.name).map((r, i) => (
                      <div key={i} style={{ fontSize: 12 }}>
                        <p style={{ fontWeight: 800, color: NAVY, margin: 0 }}>{r.name}{r.org ? <span style={{ color: `${NAVY}99`, fontWeight: 600 }}> — {r.org}</span> : null}</p>
                        {r.contact && <p style={{ color: BLUE, margin: '2px 0 0', direction: 'ltr', textAlign: dir === 'rtl' ? 'right' : 'left' }}>{r.contact}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* التذييل */}
          <div style={{ borderTop: `2px solid ${GRAY}`, paddingTop: 12, display: 'flex', justifyContent: 'space-between', color: `${NAVY}77`, fontSize: 10.5 }}>
            <span>{L.generatedBy}</span>
            <span>{new Date().toLocaleDateString(lang === 'ar' ? 'ar' : 'en-GB')}</span>
          </div>
        </div>
      </div>

      {/* رابط رجوع للمحرر */}
      <div className="no-print" style={{ textAlign: 'center', paddingBottom: 32 }}>
        <a href="/cv" style={{ color: BLUE, fontWeight: 700, fontSize: 14 }}>← الرجوع لتعديل السيرة الذاتية</a>
      </div>
    </div>
  )
}
