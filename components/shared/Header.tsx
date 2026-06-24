'use client'
import { Bell } from 'lucide-react'

export function Header({ title }: { title: string }) {
  return (
    <header className="bg-white shadow-card px-6 py-4 flex items-center justify-between sticky top-0 z-10">
      <h1 className="text-lg md:text-xl font-bold text-ruwad-navy">{title}</h1>
      <button
        aria-label="الإشعارات"
        className="relative w-10 h-10 rounded-full bg-ruwad-gray/40 flex items-center justify-center hover:bg-ruwad-gray transition"
      >
        <Bell size={20} className="text-ruwad-navy" />
      </button>
    </header>
  )
}
