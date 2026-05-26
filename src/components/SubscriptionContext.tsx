'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

interface SubscriptionContextType {
  isBlocked: boolean
}

const SubscriptionContext = createContext<SubscriptionContextType>({ isBlocked: false })

export function SubscriptionProvider({
  children,
  initialBlocked,
}: {
  children: React.ReactNode
  initialBlocked: boolean
}) {
  const [isBlocked, setIsBlocked] = useState(initialBlocked)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    fetch('/api/subscription-status')
      .then((r) => r.json())
      .then(({ blocked }) => {
        setIsBlocked(blocked)
        if (blocked && !pathname.startsWith('/dashboard/billing')) {
          router.replace('/dashboard/billing')
        }
      })
      .catch(() => {})
  }, [pathname, router])

  return (
    <SubscriptionContext.Provider value={{ isBlocked }}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  return useContext(SubscriptionContext)
}
