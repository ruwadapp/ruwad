export function HeroMockupCollage() {
  return (
    <div className="relative h-[340px] sm:h-[400px] w-full max-w-md mx-auto" style={{ perspective: '1000px' }}>
      <div className="absolute top-2 right-2 sm:right-6 w-52 bg-white rounded-ruwad shadow-ruwad-lg p-4 animate-float" style={{ '--tilt': '-6deg', animationDelay: '0s' } as React.CSSProperties}>
        <p className="text-xs text-ruwad-navy/50 mb-1">شهادة إتمام</p>
        <p className="font-extrabold text-ruwad-navy text-sm leading-snug">تصميم واجهات المستخدم</p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-[10px] bg-ruwad-lime text-ruwad-navy font-bold px-2 py-1 rounded-full">✓ موثّقة</span>
          <span className="text-lg">🎓</span>
        </div>
      </div>

      <div className="absolute top-28 sm:top-32 left-0 w-44 bg-ruwad-navy rounded-ruwad shadow-ruwad-lg p-4 animate-float" style={{ '--tilt': '4deg', animationDelay: '1.2s' } as React.CSSProperties}>
        <p className="text-[11px] text-white/60 mb-1">نسبة الحضور</p>
        <p className="text-2xl font-extrabold text-white">96%</p>
        <div className="w-full bg-white/20 rounded-full h-1.5 mt-2">
          <div className="bg-ruwad-lime h-1.5 rounded-full w-[96%]" />
        </div>
      </div>

      <div className="absolute bottom-6 right-8 sm:right-14 w-48 bg-ruwad-gradient rounded-ruwad shadow-ruwad-lg p-4 animate-float" style={{ '--tilt': '-3deg', animationDelay: '2.4s' } as React.CSSProperties}>
        <p className="text-[11px] text-white/70 mb-1">امتحان الوحدة الثالثة</p>
        <p className="text-2xl font-extrabold text-white">92<span className="text-sm font-medium">/100</span></p>
        <p className="text-[11px] text-ruwad-lime font-bold mt-1">ناجح بامتياز</p>
      </div>

      <div className="absolute bottom-24 left-2 sm:left-8 w-40 bg-ruwad-lime rounded-ruwad shadow-ruwad-lg p-3.5 animate-float" style={{ '--tilt': '5deg', animationDelay: '0.6s' } as React.CSSProperties}>
        <p className="text-[11px] text-ruwad-navy/70 mb-0.5">تحدٍّ جديد ⚡</p>
        <p className="font-extrabold text-ruwad-navy text-sm">تحدَّهم الآن</p>
      </div>
    </div>
  )
}
