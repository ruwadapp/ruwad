import { NextResponse } from 'next/server'

// المفتاح العام لإعادة الاشتراك من داخل عامل الخدمة
export function GET() {
  return NextResponse.json({ key: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null })
}
