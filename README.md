# رُوّاد (Ruwad)

منصة تعليمية متكاملة تتيح للمدرب إدارة الطلاب، الكورسات، الامتحانات، الاستبيانات، الحضور، والتحديات.

## التقنيات
- Next.js 14 (App Router) + TypeScript
- Supabase (DB + Auth + Realtime + Storage)
- Tailwind CSS

## التشغيل محلياً
```bash
npm install
cp .env.example .env.local   # ثم عبّئ القيم من Supabase
npm run dev
```

## حالة المشروع
هذا هو السكلت الأساسي (Phase 1): قاعدة بيانات كاملة + مصادقة + Layout عام (Sidebar/Header) + لوحة تحكم مبدئية.
الميزات القادمة: الكورسات، الامتحانات، الاستبيانات، الحضور Realtime، التحديات، الواجبات، التحليلات.
