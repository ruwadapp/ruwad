export function HeroMockupCollage() {
  return (
    <div className="relative h-[320px] sm:h-[380px] w-full max-w-md mx-auto">
      <div className="absolute top-4 right-4 sm:right-8 w-56 bg-white rounded-ruwad shadow-ruwad-lg p-5 animate-float" style={{ '--tilt': '-4deg', animationDelay: '0s' } as React.CSSProperties}>
        <p className="text-xs text-ruwad-navy/50 mb-1">شهادة إتمام</p>
        <p className="font-extrabold text-ruwad-navy leading-snug">تصميم واجهات المستخدم</p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-[10px] bg-ruwad-lime text-ruwad-navy font-bold px-2 py-1 rounded-full">✓ موثّقة</span>
          <span className="text-lg">🎓</span>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 sm:left-10 w-52 bg-ruwad-navy rounded-ruwad shadow-ruwad-lg p-5 animate-float" style={{ '--tilt': '3deg', animationDelay: '1.5s' } as React.CSSProperties}>
        <p className="text-xs text-white/60 mb-1">نسبة الحضور</p>
        <p className="text-3xl font-extrabold text-white">96%</p>
        <div className="w-full bg-white/20 rounded-full h-1.5 mt-2">
          <div className="bg-ruwad-lime h-1.5 rounded-full w-[96%]" />
        </div>
      </div>
    </div>
  )
}
