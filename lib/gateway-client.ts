import fs from 'fs'
import path from 'path'
import { verifyMessage } from 'viem'

const LEDGER_PATH = path.join(process.cwd(), 'data', 'gateway-ledgers.json')

export interface Transaction {
  address: string
  type: 'deposit' | 'spend'
  amount: number
  timestamp: number
  description: string
  txHash?: string
}

export interface Ledger {
  balances: Record<string, number>
  transactions: Transaction[]
}

function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath)
  if (fs.existsSync(dirname)) {
    return true
  }
  ensureDirectoryExistence(dirname)
  fs.mkdirSync(dirname)
}

function readLedger(): Ledger {
  try {
    if (!fs.existsSync(LEDGER_PATH)) {
      return { balances: {}, transactions: [] }
    }
    const content = fs.readFileSync(LEDGER_PATH, 'utf-8')
    return JSON.parse(content)
  } catch (err) {
    console.error('Error reading ledger:', err)
    return { balances: {}, transactions: [] }
  }
}

function writeLedger(ledger: Ledger) {
  try {
    ensureDirectoryExistence(LEDGER_PATH)
    fs.writeFileSync(LEDGER_PATH, JSON.stringify(ledger, null, 2), 'utf-8')
  } catch (err) {
    console.error('Error writing ledger:', err)
  }
}

export const GatewayClient = {
  getGatewayBalance(address: string): number {
    const ledger = readLedger()
    const addr = address.toLowerCase()
    return ledger.balances[addr] || 0
  },

  depositToGateway(address: string, amount: number, txHash?: string): { success: boolean; newBalance: number } {
    const ledger = readLedger()
    const addr = address.toLowerCase()
    const current = ledger.balances[addr] || 0
    const newBalance = Number((current + amount).toFixed(6))
    
    ledger.balances[addr] = newBalance
    ledger.transactions.push({
      address: addr,
      type: 'deposit',
      amount,
      timestamp: Date.now(),
      description: `Deposited ${amount} USDC via Gateway Portal`,
      txHash
    })

    writeLedger(ledger)
    return { success: true, newBalance }
  },

  spendGatewayBalance(address: string, amount: number, description: string): { success: boolean; newBalance: number } {
    const ledger = readLedger()
    const addr = address.toLowerCase()
    const current = ledger.balances[addr] || 0

    if (current < amount) {
      return { success: false, newBalance: current }
    }

    const newBalance = Number((current - amount).toFixed(6))
    ledger.balances[addr] = newBalance
    ledger.transactions.push({
      address: addr,
      type: 'spend',
      amount,
      timestamp: Date.now(),
      description
    })

    writeLedger(ledger)
    return { success: true, newBalance }
  },

  getTransactions(address: string): Transaction[] {
    const ledger = readLedger()
    const addr = address.toLowerCase()
    return ledger.transactions.filter(t => t.address === addr)
  },

  async verifyNanopaymentProof(proofString: string, expectedAmount: number): Promise<{ valid: boolean; error?: string; newBalance?: number }> {
    try {
      const proof = JSON.parse(proofString)
      const { signature, timestamp, nonce, address, amount } = proof

      if (!signature || !timestamp || !nonce || !address || !amount) {
        return { valid: false, error: 'Missing required proof fields' }
      }

      // 1. Validate amount matches expected fee
      const parsedAmount = parseFloat(amount)
      if (parsedAmount < expectedAmount) {
        return { valid: false, error: 'Insufficient payment amount in proof' }
      }

      // 2. Prevent replay attacks (check if timestamp is within 10 minutes)
      const diff = Math.abs(Date.now() - timestamp)
      if (diff > 600000) {
        return { valid: false, error: 'Payment signature expired' }
      }

      // 3. Verify cryptographic signature
      const message = `Circle Nanopayment: ${address.toLowerCase()} pays ${amount} USDC. Nonce: ${nonce}. Timestamp: ${timestamp}`
      const isValid = await verifyMessage({
        address: address as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      })

      if (!isValid) {
        return { valid: false, error: 'Cryptographic signature verification failed' }
      }

      // 4. Check user balance and settle fee
      const result = this.spendGatewayBalance(address, expectedAmount, `Underwriter AI request: ${nonce}`)
      if (!result.success) {
        return { valid: false, error: 'Insufficient Gateway balance' }
      }

      return { valid: true, newBalance: result.newBalance }
    } catch (err: any) {
      return { valid: false, error: `Invalid proof format: ${err.message}` }
    }
  }
}
