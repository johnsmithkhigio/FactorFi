import type { Metadata } from 'next'
import { Web3Provider } from '@/lib/web3-provider'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'FactorFi — Reverse Factoring Protocol on Arc',
  description: 'On-chain reverse factoring platform. Anchor companies pre-approve supplier invoices. Investors fund receivables for instant yield. Built on Arc with USDC settlement.',
  keywords: ['factoring', 'trade finance', 'USDC', 'Arc', 'DeFi', 'invoices', 'stablecoin'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Web3Provider>
          {children}
          <Toaster
            position="bottom-right"
            theme="dark"
            richColors
            toastOptions={{
              style: {
                fontFamily: 'var(--ff-font)',
                fontSize: '13px',
              },
            }}
          />
        </Web3Provider>
      </body>
    </html>
  )
}
