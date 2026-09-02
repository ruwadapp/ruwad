'use client'
import { useState, type ReactNode } from 'react'
import { CreditCard, ReceiptText } from 'lucide-react'

// تبويبا المالية: الخطط والدفعات | المصاريف والرواتب
export function FinanceTabs({ plans, expenses }: { plans: ReactNode; expenses: ReactNode }) {
  const [tab, setTab] = useState<'plans' | 'expenses'>('plans')
  const base = 'flex-1 flex items-center justify-center gap-2 py-3 rounded-ruwad-sm text-sm font-extrabold border-2 transition'
  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-2 bg-white rounded-ruwad shadow-card p-2">
        <button onClick={() => setTab('plans')}
          className={`${base} ${tab === 'plans' ? 'bg-ruwad-navy text-white border-ruwad-navy' : 'bg-white text-ruwad-navy/60 border-transparent hover:border-ruwad-gray'}`}>
          <CreditCard size={16} /> الأقساط والدفعات
        </button>
        <button onClick={() => setTab('expenses')}
          className={`${base} ${tab === 'expenses' ? 'bg-ruwad-navy text-white border-ruwad-navy' : 'bg-white text-ruwad-navy/60 border-transparent hover:border-ruwad-gray'}`}>
          <ReceiptText size={16} /> المصاريف والرواتب
        </button>
      </div>
      <div className={tab === 'plans' ? '' : 'hidden'}>{plans}</div>
      <div className={tab === 'expenses' ? '' : 'hidden'}>{expenses}</div>
    </div>
  )
}
