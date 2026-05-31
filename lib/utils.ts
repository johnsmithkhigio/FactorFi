import { formatUnits } from 'viem'
import { USDC_DECIMALS } from './contracts'

/** Format USDC amount from raw units (6 decimals) to display string */
export function formatUSDC(raw: bigint): string {
  const formatted = formatUnits(raw, USDC_DECIMALS)
  const num = parseFloat(formatted)
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

/** Truncate address for display */
export function truncateAddress(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

/** Get Arcscan link for a transaction */
export function getExplorerTxLink(hash: string): string {
  return `https://testnet.arcscan.app/tx/${hash}`
}

/** Get Arcscan link for an address */
export function getExplorerAddressLink(address: string): string {
  return `https://testnet.arcscan.app/address/${address}`
}

/** Format timestamp to relative time */
export function timeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp)
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

/** Format date from Unix timestamp */
export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Invoice status labels */
export const STATUS_LABELS: Record<number, string> = {
  0: 'Submitted',
  1: 'Approved',
  2: 'Funded',
  3: 'Settled',
  4: 'Defaulted',
}

/** Invoice status colors */
export const STATUS_COLORS: Record<number, string> = {
  0: '#f59e0b', // amber
  1: '#3b82f6', // blue
  2: '#8b5cf6', // violet
  3: '#10b981', // green
  4: '#ef4444', // red
}

/** Calculate investor yield from discount */
export function calculateYield(discountBps: number, daysToMaturity: number): number {
  if (daysToMaturity <= 0) return 0
  const discountRate = discountBps / 10000
  const annualizedYield = (discountRate / daysToMaturity) * 365 * 100
  return parseFloat(annualizedYield.toFixed(2))
}
