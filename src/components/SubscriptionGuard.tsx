'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export default function SubscriptionGuard() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (pathname.startsWith('/dashboard/billing')) return
    fetch('/api/subscription-status')
      .then((r) => r.json())
      .then(({ blocked }) => {
        if (blocked) router.replace('/dashboard/billing')
      })
      .catch(() => {})
  }, [pathname, router])

  return null
}
