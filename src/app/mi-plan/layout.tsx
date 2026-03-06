'use client'

import TopNav from '@/components/TopNav'

export default function MiPlanLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <TopNav />
      {children}
    </div>
  )
}
