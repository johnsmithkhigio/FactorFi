import { NextRequest, NextResponse } from 'next/server'
import { CircleDevWalletsManager } from '@/lib/circle-dev-wallets'
import { createWalletClient, createPublicClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arcTestnet } from '@/lib/arc-config'
import { FACTORFI_CONTRACT_ADDRESS, factorFiAbi } from '@/lib/contracts'

export async function POST(req: NextRequest) {
  try {
    const { companyName, creditRating } = await req.json()

    if (!companyName || !creditRating) {
      return NextResponse.json(
        { error: 'Company Name and Credit Rating are required' },
        { status: 400 }
      )
    }

    console.log('=== Deploying Programmatic Anchor Wallet ===')
    console.log('Company:', companyName)
    console.log('Rating:', creditRating)

    // 1. Generate programmatic wallet credentials
    const manager = CircleDevWalletsManager.getInstance()
    const wallet = await manager.createProgrammaticWallet(companyName)

    // 2. Automatically register this wallet address as an Anchor on-chain
    // We utilize the system master key to sign the registration transaction
    const masterPrivateKey = process.env.PRIVATE_KEY
    if (!masterPrivateKey) {
      return NextResponse.json(
        { error: 'Server configuration error: missing master key' },
        { status: 500 }
      )
    }

    const masterAccount = privateKeyToAccount(`0x${masterPrivateKey.replace(/^0x/, '')}`)
    const publicClient = createPublicClient({
      chain: arcTestnet,
      transport: http()
    })
    const masterWalletClient = createWalletClient({
      account: masterAccount,
      chain: arcTestnet,
      transport: http()
    })

    // Execute Anchor registration call on-chain on behalf of the generated wallet
    // Since registerAnchor registers msg.sender, we can execute the registration transaction
    // directly from the generated programmatic wallet itself!
    // But since the generated wallet has 0 USDC for gas, we first fund it with a tiny amount of gas,
    // or we submit the transaction from the generated wallet sponsored by the relayer!
    // To fund the newly generated wallet with enough gas to self-register:
    console.log('Funding generated wallet with gas from relayer...')
    const fundHash = await masterWalletClient.sendTransaction({
      to: wallet.address as `0x${string}`,
      value: BigInt(50000000000000) // 0.00005 USDC for gas
    })
    await publicClient.waitForTransactionReceipt({ hash: fundHash })
    console.log('Funding transaction confirmed. Self-registering anchor...')

    // Now, have the generated wallet register itself on the FactorFi contract
    const selfPrivateKey = manager.decryptSecret(wallet.encryptedKey)
    const selfAccount = privateKeyToAccount(`0x${selfPrivateKey}`)
    const selfWalletClient = createWalletClient({
      account: selfAccount,
      chain: arcTestnet,
      transport: http()
    })

    const regHash = await selfWalletClient.writeContract({
      address: FACTORFI_CONTRACT_ADDRESS,
      abi: factorFiAbi,
      functionName: 'registerAnchor',
      args: [companyName, BigInt(creditRating)]
    })
    await publicClient.waitForTransactionReceipt({ hash: regHash })
    console.log('Anchor successfully registered on-chain! Hash:', regHash)

    // Generate a secure Bearer Token for corporate API access
    const bearerToken = `ff_api_${Buffer.from(companyName + wallet.address).toString('base64').slice(0, 32)}`

    return NextResponse.json({
      success: true,
      walletId: wallet.walletId,
      address: wallet.address,
      companyName: wallet.companyName,
      encryptedKey: wallet.encryptedKey,
      registrationHash: regHash,
      apiKey: bearerToken,
      message: 'Developer-Controlled wallet successfully deployed and registered as Anchor!'
    })

  } catch (err: any) {
    console.error('Failed to create programmatic anchor wallet:', err)
    return NextResponse.json(
      { error: 'Programmatic wallet creation failed', details: err.message },
      { status: 500 }
    )
  }
}
