'use client'
import { NotificationBell } from './NotificationBell'

export function Header({ title }: { title: string }) {
  return (
    <header className="bg-white shadow-card px-6 py-4 flex items-center justify-between sticky top-0 z-10">
      <h1 className="text-lg md:text-xl font-bold text-ruwad-navy">{title}</h1>
      <NotificationBell />
    </header>
  )
}
