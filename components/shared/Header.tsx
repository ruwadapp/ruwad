'use client'
import Link from 'next/link'
import { NotificationBell } from './NotificationBell'
import { ChatHeaderButton } from './ChatHeaderButton'
import { CalendarHeaderButton } from './CalendarHeaderButton'
import { RawaqHeaderButton } from './RawaqHeaderButton'
import { GlobalSearch } from './GlobalSearch'
import { UserCircle } from 'lucide-react'

// الترويسة: على الهاتف سطران (العنوان ثم الأزرار) كي لا يلتصق النص بالأزرار،
// وعلى الشاشات الواسعة سطر واحد كالسابق
export function Header({ title }: { title: string }) {
  return (
    <header className="bg-white shadow-card px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 sticky top-0 z-10">
      <h1 className="text-lg md:text-xl font-bold text-ruwad-navy leading-tight">{title}</h1>
      <div className="flex items-center gap-2 -mr-1 sm:mr-0">
        <GlobalSearch />
        <RawaqHeaderButton />
        <CalendarHeaderButton />
        <ChatHeaderButton />
        <NotificationBell />
        <Link
          href="/profile"
          aria-label="الملف الشخصي"
          className="w-10 h-10 rounded-full bg-ruwad-gray/40 text-ruwad-navy flex items-center justify-center hover:bg-ruwad-gray transition"
        >
          <UserCircle size={22} />
        </Link>
      </div>
    </header>
  )
}
