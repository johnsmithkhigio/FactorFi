import { NextRequest, NextResponse } from 'next/server'
import { createWalletClient, createPublicClient, http, parseUnits } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arcTestnet } from '@/lib/arc-config'
import { FACTORFI_CONTRACT_ADDRESS, factorFiAbi } from '@/lib/contracts'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { supplier, anchor, amount, dueDate, description, invoiceHash, signature, token } = await req.json()

    // 1. Validation checks
    if (!supplier || !anchor || !amount || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required invoice parameters' },
        { status: 400 }
      )
    }

    const activeToken = token || '0x3600000000000000000000000000000000000000'
    const amountParsed = parseUnits(amount, 6) // Both USDC/EURC use 6 decimals on Arc
    const dueDateUnix = BigInt(Math.floor(new Date(dueDate).getTime() / 1000))

    if (amountParsed <= BigInt(0)) {
      return NextResponse.json(
        { error: 'Invoice amount must be greater than zero' },
        { status: 400 }
      )
    }

    if (dueDateUnix <= BigInt(Math.floor(Date.now() / 1000))) {
      return NextResponse.json(
        { error: 'Due date must be in the future' },
        { status: 400 }
      )
    }

    console.log('=== Paymaster Relayer Sponsoring Transaction ===')
    console.log('Supplier (EOA/Smart Account):', supplier)
    console.log('Anchor Target:', anchor)
    console.log('Amount (Parsed 6 Decimals):', amountParsed.toString())
    console.log('Token Target:', activeToken)
    console.log('Description:', description)
    console.log('Invoice Hash:', invoiceHash)
    console.log('Signature:', signature)

    // 2. Setup Relayer/Paymaster Wallet Client from server private key
    const privateKey = process.env.PRIVATE_KEY
    if (!privateKey) {
      return NextResponse.json(
        { error: 'Server private key not configured' },
        { status: 500 }
      )
    }

    const account = privateKeyToAccount(`0x${privateKey.replace(/^0x/, '')}`)
    const publicClient = createPublicClient({
      chain: arcTestnet,
      transport: http()
    })
    const walletClient = createWalletClient({
      account,
      chain: arcTestnet,
      transport: http()
    })

    // Check sponsor balance (paid in native USDC gas on Arc)
    const balance = await publicClient.getBalance({ address: account.address })
    console.log('Relayer balance:', (Number(balance) / 1e18).toFixed(6), 'USDC (gas)')

    // Auto-register Supplier Compliance if needed
    const isSupplierCompliant = await publicClient.readContract({
      address: FACTORFI_CONTRACT_ADDRESS,
      abi: factorFiAbi,
      functionName: 'isCompliant',
      args: [supplier]
    })

    if (!isSupplierCompliant) {
      console.log(`Supplier ${supplier} is not compliant. Auto-registering compliance...`)
      const registerComplianceHash = await walletClient.writeContract({
        address: FACTORFI_CONTRACT_ADDRESS,
        abi: factorFiAbi,
        functionName: 'updateComplianceStatus',
        args: [supplier, true]
      })
      console.log(`Compliance tx submitted. Hash: ${registerComplianceHash}. Waiting for confirmation...`)
      await publicClient.waitForTransactionReceipt({ hash: registerComplianceHash })
      console.log('Supplier registered as compliant!')
    } else {
      console.log(`Supplier ${supplier} is already compliant.`)
    }

    // Auto-register Anchor if needed
    const anchorData = await publicClient.readContract({
      address: FACTORFI_CONTRACT_ADDRESS,
      abi: factorFiAbi,
      functionName: 'getAnchor',
      args: [anchor]
    }) as any

    const isAnchorRegistered = Array.isArray(anchorData) ? anchorData[4] : (anchorData?.isRegistered || false)

    if (!isAnchorRegistered) {
      console.log(`Anchor ${anchor} is not registered. Auto-registering anchor...`)
      const registerAnchorHash = await walletClient.writeContract({
        address: FACTORFI_CONTRACT_ADDRESS,
        abi: factorFiAbi,
        functionName: 'registerAnchorOnBehalf',
        args: [anchor, 'Auto-Registered Anchor', 750n]
      })
      console.log(`Anchor registration tx submitted. Hash: ${registerAnchorHash}. Waiting for confirmation...`)
      await publicClient.waitForTransactionReceipt({ hash: registerAnchorHash })
      console.log('Anchor registered successfully!')
    } else {
      console.log(`Anchor ${anchor} is already registered.`)
    }

    // 3. Formulate and broadcast sponsored transaction on Arc Testnet
    const txHash = await walletClient.writeContract({
      address: FACTORFI_CONTRACT_ADDRESS,
      abi: factorFiAbi,
      functionName: 'submitInvoiceOnBehalf',
      args: [
        supplier,
        anchor, 
        amountParsed, 
        dueDateUnix, 
        description || 'Sponsored Invoice',
        invoiceHash || '0x0000000000000000000000000000000000000000000000000000000000000000',
        signature || '0x',
        activeToken
      ],
    })

    console.log('Sponsored Tx submitted successfully! Hash:', txHash)

    return NextResponse.json({
      success: true,
      hash: txHash,
      paymaster: account.address,
      sponsoredGas: '0.0001 USDC',
      message: 'Transaction sponsored successfully by FactorFi Paymaster!'
    })

  } catch (err: any) {
    console.error('Sponsorship execution failed:', err)
    return NextResponse.json(
      { error: 'Sponsorship execution failed', details: err.message },
      { status: 500 }
    )
  }
}
