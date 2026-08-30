'use client'
import { useState } from 'react'
import { Map, List } from 'lucide-react'

// تبويبا عرض الكورس: "الرحلة" (الخريطة) و"القائمة" (العرض التقليدي كما هو)
export function CourseViewTabs({ journey, list }: { journey: React.ReactNode; list: React.ReactNode }) {
  const [tab, setTab] = useState<'journey' | 'list'>('journey')
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-full shadow-card p-1.5 flex items-center gap-1 self-center">
        <button
          onClick={() => setTab('journey')}
          className={`flex items-center gap-1.5 text-sm font-bold px-5 py-2 rounded-full transition ${
            tab === 'journey' ? 'bg-ruwad-blue text-white shadow-ruwad' : 'text-ruwad-navy/55 hover:bg-ruwad-gray/20'
          }`}
        >
          <Map size={15} /> الرحلة
        </button>
        <button
          onClick={() => setTab('list')}
          className={`flex items-center gap-1.5 text-sm font-bold px-5 py-2 rounded-full transition ${
            tab === 'list' ? 'bg-ruwad-blue text-white shadow-ruwad' : 'text-ruwad-navy/55 hover:bg-ruwad-gray/20'
          }`}
        >
          <List size={15} /> القائمة
        </button>
      </div>
      <div className={tab === 'journey' ? '' : 'hidden'}>{journey}</div>
      <div className={tab === 'list' ? '' : 'hidden'}>{list}</div>
    </div>
  )
}
