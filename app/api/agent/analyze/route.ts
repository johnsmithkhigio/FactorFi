import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(req: Request) {
  try {
    const contractsDir = path.join(process.cwd(), 'contracts')
    const files = ['FactorFi.sol', 'AutoFactorVault.sol', 'InvoiceReceiptNFT.sol', 'FactorFiMarketplace.sol']
    const analysisResults: any[] = []

    for (const file of files) {
      const filePath = path.join(contractsDir, file)
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8')
        const lines = content.split('\n')
        const loc = lines.length
        
        // Basic analysis
        const functions = (content.match(/function\s+\w+/g) || []).length
        const events = (content.match(/event\s+\w+/g) || []).length
        const hasReentrancyGuard = content.includes('nonReentrant') || content.includes('ReentrancyGuard')
        const hasOwnable = content.includes('Ownable') || content.includes('onlyOwner')
        const hasCircleUSDC = content.includes('USDC') || content.includes('0x3600000000000000000000000000000000000000')

        analysisResults.push({
          file,
          loc,
          functions,
          events,
          hasReentrancyGuard,
          hasOwnable,
          hasCircleUSDC,
          description: getContractDescription(file)
        })
      }
    }

    // Read env keys (sanitized) to confirm system health
    const envStatus = {
      FACTORFI_ADDRESS: !!process.env.FACTORFI_ADDRESS,
      AUTO_FACTOR_VAULT_ADDRESS: !!process.env.AUTO_FACTOR_VAULT_ADDRESS,
      INVOICE_RECEIPT_NFT_ADDRESS: !!process.env.INVOICE_RECEIPT_NFT_ADDRESS,
      FACTORFI_MARKETPLACE_ADDRESS: !!process.env.FACTORFI_MARKETPLACE_ADDRESS,
      PRIVATE_KEY: !!process.env.PRIVATE_KEY,
      DEEPSEEK_API_KEY: !!process.env.DEEPSEEK_API_KEY,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY
    }

    return NextResponse.json({
      success: true,
      contracts: analysisResults,
      envStatus,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error analyzing repository:', error)
    return NextResponse.json({ error: error.message || 'Failed to analyze repository' }, { status: 500 })
  }
}

function getContractDescription(filename: string): string {
  switch (filename) {
    case 'FactorFi.sol':
      return 'Core factoring engine. Manages invoice records, discount rates, payouts, and maturity calculations.'
    case 'AutoFactorVault.sol':
      return 'Institutional yield vault. Automatically aggregates and deploys investor USDC into active invoice pools.'
    case 'InvoiceReceiptNFT.sol':
      return 'Tokenized receivable NFT. Mints proof-of-invoice representation to enable secondary market trading.'
    case 'FactorFiMarketplace.sol':
      return 'Invoice secondary trading floor. Allows suppliers/investors to list and sell active invoice NFTs.'
    default:
      return 'FactorFi Protocol smart contract component.'
  }
}
