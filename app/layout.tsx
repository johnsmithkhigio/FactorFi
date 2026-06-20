import type { Metadata } from 'next'
import { Web3Provider } from '@/lib/web3-provider'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'FactorFi — Reverse Factoring Protocol on Arc',
  description: 'On-chain reverse factoring platform. Anchor companies pre-approve supplier invoices. Investors fund receivables for instant yield. Built on Arc with USDC settlement.',
  keywords: ['factoring', 'trade finance', 'USDC', 'Arc', 'DeFi', 'invoices', 'stablecoin'],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon-64x64.png', sizes: '64x64', type: 'image/png' },
      { url: '/favicon-128x128.png', sizes: '128x128', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#38bdf8',
      },
    ],
  },
  manifest: '/site.webmanifest',
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
