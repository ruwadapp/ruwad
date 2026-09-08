// الخطط تُدار بالكامل من لوحة السوبر أدمن (جدول platform_plans)
// وتُقرأ في: الصفحة التسويقية، نافذة تعيين خطة حساب، نافذة خطة البوابة.

export interface PlatformPlan {
  id: string
  name: string
  name_en: string
  tagline: string
  tagline_en: string
  monthly_price: number
  yearly_price: number
  features: string[]
  features_en: string[]
  is_popular: boolean
  is_portal: boolean
  is_active: boolean
  sort_order: number
  updated_at?: string
}

export const PLANS_SELECT =
  'id, name, name_en, tagline, tagline_en, monthly_price, yearly_price, features, features_en, is_popular, is_portal, is_active, sort_order, updated_at'
