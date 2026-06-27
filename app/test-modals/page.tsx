import TestModalsClient from './TestModalsClient'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Unified Modal Playground | FactorFi Protocol',
  description: 'Interactive sandbox for test workflows. Developer testing tool.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
}

export default function Page() {
  return <TestModalsClient />
}
