import { NextRequest, NextResponse } from 'next/server'
import { createWalletClient, createPublicClient, http, parseUnits } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arcTestnet } from '@/lib/arc-config'
import { USDC_ADDRESS_ARC, EURC_ADDRESS_ARC, usdcAbi } from '@/lib/contracts'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json()

    if (!address || !address.startsWith('0x')) {
      return NextResponse.json({ error: 'Valid Ethereum address is required' }, { status: 400 })
    }

    const privateKey = process.env.PRIVATE_KEY
    if (!privateKey) {
      return NextResponse.json({ error: 'Server private key not configured' }, { status: 500 })
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

    console.log(`[Faucet] Processing request for address: ${address}`)

    // 1. Send native USDC gas (represented with 18 decimals on Arc Testnet)
    // 0.05 native USDC is more than enough for dozens of test transactions
    const nativeGasAmount = parseUnits('0.05', 18)
    let nativeGasTxHash = ''
    try {
      nativeGasTxHash = await walletClient.sendTransaction({
        to: address,
        value: nativeGasAmount
      })
      console.log(`[Faucet] Native gas transfer hash: ${nativeGasTxHash}`)
    } catch (e: any) {
      console.error(`[Faucet] Failed to send native gas:`, e.message)
      return NextResponse.json({ error: 'Failed to send native gas', details: e.message }, { status: 500 })
    }

    // 2. Send ERC20 USDC (6 decimals)
    const erc20Amount = parseUnits('1000', 6) // $1,000 USDC
    let usdcTxHash = ''
    let usdcSuccess = false
    try {
      usdcTxHash = await walletClient.writeContract({
        address: USDC_ADDRESS_ARC,
        abi: usdcAbi,
        functionName: 'transfer',
        args: [address, erc20Amount]
      })
      usdcSuccess = true
      console.log(`[Faucet] ERC20 USDC transfer hash: ${usdcTxHash}`)
    } catch (e: any) {
      console.warn(`[Faucet] ERC20 USDC transfer failed: ${e.message}. Attempting mint if supported...`)
      // Try to mint directly if the token supports it on testnet
      try {
        usdcTxHash = await walletClient.writeContract({
          address: USDC_ADDRESS_ARC,
          abi: [
            {
              inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
              name: 'mint',
              outputs: [],
              stateMutability: 'nonpayable',
              type: 'function'
            }
          ],
          functionName: 'mint',
          args: [address, erc20Amount]
        })
        usdcSuccess = true
        console.log(`[Faucet] ERC20 USDC mint hash: ${usdcTxHash}`)
      } catch (mintErr: any) {
        console.error(`[Faucet] ERC20 USDC mint also failed: ${mintErr.message}`)
      }
    }

    // 3. Send ERC20 EURC (6 decimals)
    let eurcTxHash = ''
    let eurcSuccess = false
    try {
      eurcTxHash = await walletClient.writeContract({
        address: EURC_ADDRESS_ARC,
        abi: usdcAbi,
        functionName: 'transfer',
        args: [address, erc20Amount]
      })
      eurcSuccess = true
      console.log(`[Faucet] ERC20 EURC transfer hash: ${eurcTxHash}`)
    } catch (e: any) {
      console.warn(`[Faucet] ERC20 EURC transfer failed: ${e.message}. Attempting mint if supported...`)
      // Try to mint directly if the token supports it on testnet
      try {
        eurcTxHash = await walletClient.writeContract({
          address: EURC_ADDRESS_ARC,
          abi: [
            {
              inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
              name: 'mint',
              outputs: [],
              stateMutability: 'nonpayable',
              type: 'function'
            }
          ],
          functionName: 'mint',
          args: [address, erc20Amount]
        })
        eurcSuccess = true
        console.log(`[Faucet] ERC20 EURC mint hash: ${eurcTxHash}`)
      } catch (mintErr: any) {
        console.error(`[Faucet] ERC20 EURC mint also failed: ${mintErr.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      nativeGasTxHash,
      usdcTxHash,
      eurcTxHash,
      usdcSuccess,
      eurcSuccess,
      message: 'Faucet dispense complete. Native gas sent successfully.'
    })

  } catch (error: any) {
    console.error('Faucet API failure:', error)
    return NextResponse.json({ error: 'Failed to dispense faucet funds', details: error.message }, { status: 500 })
  }
}
