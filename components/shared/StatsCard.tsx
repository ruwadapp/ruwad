import type { ReactNode } from 'react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: ReactNode
  variant?: 'blue' | 'lime' | 'white'
}

const styles = {
  blue: 'bg-ruwad-gradient text-white shadow-ruwad',
  lime: 'bg-ruwad-lime text-ruwad-navy shadow-card',
  white: 'bg-white text-ruwad-navy shadow-card',
}

export function StatsCard({ title, value, icon, variant = 'white' }: StatsCardProps) {
  return (
    <div className={`${styles[variant]} rounded-ruwad p-6 flex flex-col gap-3`}>
      <div className="text-3xl">{icon}</div>
      <p className="text-sm opacity-75">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}
