export function AuthHero() {
  return (
    <div className="relative hidden lg:flex lg:w-1/2 bg-ruwad-gradient overflow-hidden items-center justify-center p-12">
      {/* فقاعات ضوء معتّمة بالخلفية */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -left-20 w-80 h-80 bg-ruwad-lime/20 rounded-full blur-3xl" />
      <div className="absolute top-1/3 left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />

      <div className="relative z-10 flex flex-col gap-10 max-w-md">
        <div>
          <h1 className="text-5xl font-extrabold text-white">رُوّاد</h1>
          <p className="text-white/80 text-lg mt-2">منصتك التعليمية المتكاملة</p>
          <p className="text-white/60 text-sm mt-3 leading-relaxed">
            كورسات، امتحانات، حضور لحظي، وتحديات تنافسية — كل ما يحتاجه المدرب لإدارة طلابه في مكان واحد.
          </p>
        </div>

        {/* بطاقات عائمة تعرض محتوى حقيقياً من التطبيق */}
        <div className="relative h-64">
          <div className="absolute top-0 right-4 w-52 bg-white rounded-ruwad shadow-ruwad-lg p-4 -rotate-6">
            <p className="text-3xl mb-1">🏆</p>
            <p className="font-bold text-ruwad-navy text-sm">الرائد الأول</p>
            <p className="text-xs text-ruwad-navy/50">شارة فريدة — لشخص واحد فقط</p>
          </div>

          <div className="absolute top-20 left-0 w-44 bg-ruwad-navy rounded-ruwad shadow-ruwad-lg p-4 rotate-3">
            <p className="text-xs text-white/60 mb-1">نسبة الحضور</p>
            <p className="text-2xl font-bold text-white">92%</p>
            <div className="w-full bg-white/20 rounded-full h-1.5 mt-2">
              <div className="bg-ruwad-lime h-1.5 rounded-full w-[92%]" />
            </div>
          </div>

          <div className="absolute bottom-0 right-10 w-48 bg-ruwad-lime rounded-ruwad shadow-ruwad-lg p-4 -rotate-2">
            <p className="text-xs text-ruwad-navy/70 mb-1">تحدٍ جديد ⚡</p>
            <p className="font-bold text-ruwad-navy text-sm">حدّاهم الآن</p>
          </div>
        </div>
      </div>
    </div>
  )
}
