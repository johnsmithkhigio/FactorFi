import { keccak256, toHex, encodePacked, parseUnits } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

export interface InvoiceDetails {
  anchor: string
  amount: string       // Face value in units (e.g., "15000")
  dueDate: number      // Unix timestamp
  description: string
  token?: string       // Dynamic token address
}

export interface UnderwritingResult {
  details: InvoiceDetails
  invoiceHash: `0x${string}`
  signature: `0x${string}`
  confidence: number
  riskMarginBps: number
  decision: 'APPROVED' | 'REJECTED'
}

export class UnderwriterAgent {
  // 1. Computes cryptographic invoice hash to protect against double factoring
  public static calculateInvoiceHash(details: InvoiceDetails): `0x${string}` {
    const descHash = keccak256(toHex(details.description))
    const amountBig = parseUnits(details.amount, 6)
    const tokenAddr = details.token || '0x3600000000000000000000000000000000000000'
    
    return keccak256(
      encodePacked(
        ['address', 'uint256', 'uint256', 'bytes32', 'address'],
        [details.anchor as `0x${string}`, amountBig, BigInt(details.dueDate), descHash, tokenAddr as `0x${string}`]
      )
    )
  }

  // 2. Signs invoice hash using the AI Agent underwriter private key
  public static async signInvoiceHash(invoiceHash: `0x${string}`): Promise<`0x${string}`> {
    const privateKey = process.env.PRIVATE_KEY
    if (!privateKey) {
      throw new Error('Server Environment: Missing PRIVATE_KEY for underwriter identity registration')
    }
    const account = privateKeyToAccount(`0x${privateKey}`)
    
    // signMessage automatically wraps the message in the standard Ethereum Signed Message envelope
    const signature = await account.signMessage({
      message: { raw: invoiceHash }
    })
    return signature
  }

  // 3. Dynamic OCR parsing of invoice documents (PDF/images)
  public static async parseInvoiceDocument(fileBuffer: Buffer, fileName: string): Promise<InvoiceDetails> {
    console.log(`[Underwriter Agent] Extracting invoice structure from file: ${fileName} (${fileBuffer.length} bytes)`)

    // Simple LLM-OCR simulation parsing standard corporate invoices
    // Acme Corp / Tesla, Inc components
    let amount = "15000"
    let description = "Acme Corp supply components"
    let anchor = "0x32a398da1243c8b991aba311a7db8fd860c234a5" // Deployed/Mock registered anchor address
    
    if (fileName.toLowerCase().includes('tesla')) {
      amount = "25000"
      description = "Tesla EV Batteries Factoring Receivable"
      anchor = "0x32a398da1243c8b991aba311a7db8fd860c234a5"
    } else if (fileName.toLowerCase().includes('apple')) {
      amount = "8000"
      description = "Apple Inc. Silicon Wafer Supply"
      anchor = "0x32a398da1243c8b991aba311a7db8fd860c234a5"
    }

    const futureDate = Math.floor(Date.now() / 1000) + 30 * 86400 // due in 30 days
    
    return {
      anchor,
      amount,
      dueDate: futureDate,
      description
    }
  }

  // 4. Dynamic Risk Analysis matching anchor credit logs on-chain
  public static calculateRiskMargin(creditRating: number): { decision: 'APPROVED' | 'REJECTED'; riskMarginBps: number } {
    if (creditRating < 500) {
      return { decision: 'REJECTED', riskMarginBps: 0 }
    }
    
    // Higher credit rating yields lower risk margin discount rates (more premium rates for SME suppliers)
    // 900+ score = 2.0% - 2.5% discount (200-250 bps)
    // 700+ score = 3.5% discount (350 bps)
    // 500+ score = 4.8% discount (480 bps)
    let bps = 450
    if (creditRating >= 900) {
      bps = 250
    } else if (creditRating >= 700) {
      bps = 350
    }

    return { decision: 'APPROVED', riskMarginBps: bps }
  }
}
