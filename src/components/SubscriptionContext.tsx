'use client'

import { createContext, useContext } from 'react'

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
  return (
    <SubscriptionContext.Provider value={{ isBlocked: initialBlocked }}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  return useContext(SubscriptionContext)
}
