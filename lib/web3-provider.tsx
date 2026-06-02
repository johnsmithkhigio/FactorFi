'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { WagmiProvider, createConfig, http, useAccount, useDisconnect } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, getDefaultConfig, darkTheme } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import { arcTestnet } from './arc-config'

const config = getDefaultConfig({
  appName: 'FactorFi',
  projectId: 'factorfi-arc-reverse-factoring',
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: http('https://rpc.testnet.arc.network'),
  },
  ssr: true,
})

const queryClient = new QueryClient()

// Unified Authentication Context Interface
interface UnifiedAccountContextType {
  address: `0x${string}` | undefined
  isConnected: boolean
  providerType: 'eoa' | 'circle' | null
  circleEmail: string | null
  loginWithCircle: (email: string, address: `0x${string}`) => void
  logout: () => void
}

const UnifiedAccountContext = createContext<UnifiedAccountContextType | undefined>(undefined)

function UnifiedAccountProviderInner({ children }: { children: React.ReactNode }) {
  const { address: eoaAddress, isConnected: eoaConnected } = useAccount()
  const { disconnect: disconnectEOA } = useDisconnect()

  const [circleAddress, setCircleAddress] = useState<`0x${string}` | undefined>(undefined)
  const [circleEmail, setCircleEmail] = useState<string | null>(null)
  const [providerType, setProviderType] = useState<'eoa' | 'circle' | null>(null)

  // 1. Session Persistence: Hydrate Circle Embedded Wallet from LocalStorage on mount
  useEffect(() => {
    try {
      const persistedSession = localStorage.getItem('ff_circle_session')
      if (persistedSession) {
        const { email, address, expiresAt } = JSON.parse(persistedSession)
        if (Date.now() < expiresAt) {
          setCircleAddress(address)
          setCircleEmail(email)
          setProviderType('circle')
        } else {
          localStorage.removeItem('ff_circle_session')
        }
      }
    } catch (e) {
      console.error('Failed to parse persisted Circle session:', e)
    }
  }, [])

  // 2. Resolve active session (Circle takes precedence if logged in, otherwise fallback to Wagmi EOA)
  const isCircleActive = providerType === 'circle' && !!circleAddress
  const activeAddress = isCircleActive ? circleAddress : eoaAddress
  const isConnected = isCircleActive ? true : eoaConnected
  const activeProvider = isCircleActive ? 'circle' : (eoaConnected ? 'eoa' : null)

  const loginWithCircle = (email: string, address: `0x${string}`) => {
    // Save session in local storage with 7-day expiry
    const session = {
      email,
      address,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
    }
    localStorage.setItem('ff_circle_session', JSON.stringify(session))
    
    // Disconnect active EOA to avoid duplicate address session clashes
    if (eoaConnected) {
      disconnectEOA()
    }

    setCircleAddress(address)
    setCircleEmail(email)
    setProviderType('circle')
  }

  const logout = () => {
    localStorage.removeItem('ff_circle_session')
    setCircleAddress(undefined)
    setCircleEmail(null)
    setProviderType(null)
    if (eoaConnected) {
      disconnectEOA()
    }
  }

  return (
    <UnifiedAccountContext.Provider
      value={{
        address: activeAddress,
        isConnected,
        providerType: activeProvider,
        circleEmail,
        loginWithCircle,
        logout
      }}
    >
      {children}
    </UnifiedAccountContext.Provider>
  )
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#0075ff',
            accentColorForeground: 'white',
            borderRadius: 'medium',
            fontStack: 'system',
          })}
          initialChain={arcTestnet}
        >
          <UnifiedAccountProviderInner>
            {children}
          </UnifiedAccountProviderInner>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

// Global custom hook for consuming unified EOA / Circle accounts
export function useUnifiedAccount() {
  const context = useContext(UnifiedAccountContext)
  if (!context) {
    throw new Error('useUnifiedAccount must be used within a Web3Provider')
  }
  return context
}
