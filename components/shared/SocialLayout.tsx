// تخطيط "شبكة اجتماعية" موحّد لصفحات الرواق والمنشورات:
// عمود منشورات مركزي بعرض مريح + عمود جانبي ثابت (بطاقة الملف/الإحصائيات/الأدوات)
// على الشاشات الصغيرة يتحول لعمود واحد والعمود الجانبي يصعد للأعلى.
export function SocialLayout({ aside, children }: { aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <main className="min-h-[calc(100vh-72px)] bg-[#EEF0F7] p-4 md:p-6">
      <div className="mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-6 items-start">
        {aside && <aside className="flex flex-col gap-4 lg:sticky lg:top-6">{aside}</aside>}
        <div className="flex flex-col gap-4 max-w-2xl w-full mx-auto lg:mx-0">{children}</div>
      </div>
    </main>
  )
}

// بطاقة ملف صاحب الصفحة (مدرب أو معهد) بأسلوب الشبكات الاجتماعية
export function ProfileCard({
  name,
  role,
  avatarUrl,
  stats,
}: {
  name: string
  role: string
  avatarUrl?: string | null
  stats: { label: string; value: number | string }[]
}) {
  return (
    <div className="bg-white rounded-ruwad shadow-card overflow-hidden">
      <div className="h-20 bg-ruwad-gradient relative">
        <div className="absolute -bottom-8 right-5 w-16 h-16 rounded-full ring-4 ring-white bg-ruwad-navy text-white flex items-center justify-center text-2xl font-extrabold overflow-hidden">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            name.charAt(0)
          )}
        </div>
      </div>
      <div className="pt-10 px-5 pb-5">
        <p className="font-extrabold text-ruwad-navy text-lg leading-tight">{name}</p>
        <p className="text-xs text-ruwad-navy/50 mt-0.5">{role}</p>
        <div className="grid grid-cols-3 gap-2 mt-4 border-t border-ruwad-gray/50 pt-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-lg font-extrabold text-ruwad-blue">{s.value}</p>
              <p className="text-[11px] text-ruwad-navy/50 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
