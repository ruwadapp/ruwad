'use client'
import { createContext, useContext } from 'react'

export interface ActivePortalBrand {
  id: string
  instituteId: string
  displayName: string
  logoUrl: string | null
}

const PortalBrandContext = createContext<ActivePortalBrand | null>(null)

export function PortalBrandProvider({ brand, children }: { brand: ActivePortalBrand | null; children: React.ReactNode }) {
  return <PortalBrandContext.Provider value={brand}>{children}</PortalBrandContext.Provider>
}

// null يعني: زيارة عادية على النطاق الرئيسي — تُعرض هوية رُوّاد كالمعتاد
export function usePortalBrand() {
  return useContext(PortalBrandContext)
}
