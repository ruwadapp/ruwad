'use client'
import Link from 'next/link'
import { NotificationBell } from './NotificationBell'
import { UserCircle } from 'lucide-react'

export function Header({ title }: { title: string }) {
  return (
    <header className="bg-white shadow-card px-6 py-4 flex items-center justify-between sticky top-0 z-10">
      <h1 className="text-lg md:text-xl font-bold text-ruwad-navy">{title}</h1>
      <div className="flex items-center gap-2">
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
