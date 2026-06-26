import { NextRequest, NextResponse } from 'next/server'
import { initiateUserControlledWalletsClient, Blockchain } from '@circle-fin/user-controlled-wallets'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const circleClient = initiateUserControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY!,
})

export async function POST(req: NextRequest) {
  try {
    const { email, fetchAddressOnly, userToken: inputUserToken } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email address is required' },
        { status: 400 }
      )
    }

    const userId = email.toLowerCase().trim()

    // 1. Fetch address only if requested after PIN challenge completion
    if (fetchAddressOnly && inputUserToken) {
      console.log(`[Circle W3S] Fetching wallet address for user: ${userId}`)
      
      let wallets: any[] = []
      // Retry up to 8 times with a 1.5s delay to allow Circle's async relayer to mint the wallet on-chain
      for (let attempt = 1; attempt <= 8; attempt++) {
        try {
          const walletsRes = await circleClient.listWallets({ userToken: inputUserToken })
          wallets = walletsRes.data?.wallets || []
          if (wallets.length > 0) {
            console.log(`[Circle W3S] Found wallet on attempt ${attempt}:`, wallets.map((w: any) => `${w.blockchain}: ${w.address}`))
            break
          }
        } catch (e: any) {
          console.warn(`[Circle W3S] listWallets attempt ${attempt} warning:`, e.message)
        }
        console.log(`[Circle W3S] Attempt ${attempt}: Wallet not indexed yet. Retrying in 1.5s...`)
        await new Promise(resolve => setTimeout(resolve, 1500))
      }

      if (wallets.length > 0) {
        const arcWallet = wallets.find((w: any) => w.blockchain === Blockchain.ArcTestnet) || wallets[0]
        console.log(`[Circle W3S] Found wallet address: ${arcWallet.address}`)
        return NextResponse.json({
          success: true,
          address: arcWallet.address,
        })
      } else {
        return NextResponse.json(
          { error: 'No wallets found for this user.' },
          { status: 404 }
        )
      }
    }

    console.log('=== Initializing Circle Non-Custodial Wallet Session ===')
    console.log('User Email:', email)

    // 2. Register user if not exists
    try {
      await circleClient.createUser({ userId })
      console.log(`[Circle W3S] Created new user profile for: ${userId}`)
    } catch (err: any) {
      const code = err.response?.data?.code
      if (code === 155106) {
        console.log(`[Circle W3S] User already registered: ${userId}`)
      } else {
        console.warn(`[Circle W3S] createUser warning (proceeding):`, err.response?.data || err.message)
      }
    }

    // 3. Generate User Token & Encryption Key (valid for 60 mins)
    const tokenRes = await circleClient.createUserToken({ userId })
    const { userToken, encryptionKey } = (tokenRes.data as any) || {}
    console.log('[Circle W3S] Session token generated successfully')

    // 4. Check if user already has wallets
    const walletsRes = await circleClient.listWallets({ userToken })
    const wallets = walletsRes.data?.wallets || []

    if (wallets.length > 0) {
      const arcWallet = wallets.find((w: any) => w.blockchain === Blockchain.ArcTestnet) || wallets[0]
      console.log(`[Circle W3S] Existing wallet found: ${arcWallet.address}`)
      return NextResponse.json({
        success: true,
        email: email,
        address: arcWallet.address,
        challengeId: null,
        userToken,
        encryptionKey,
        expiresAt: Date.now() + 60 * 60 * 1000,
        message: 'Circle user logged in successfully!'
      })
    }

    // 5. Initiate PIN & Wallet creation challenge for new users
    console.log('[Circle W3S] Creating user PIN with wallets challenge')
    const pinRes = await circleClient.createUserPinWithWallets({
      userToken,
      blockchains: [Blockchain.ArcTestnet],
      accountType: 'SCA',
      idempotencyKey: crypto.randomUUID(),
    })
    const { challengeId } = (pinRes.data as any) || {}

    return NextResponse.json({
      success: true,
      email: email,
      challengeId,
      userToken,
      encryptionKey,
      expiresAt: Date.now() + 60 * 60 * 1000,
      message: 'Circle user challenge initiated successfully!'
    })

  } catch (err: any) {
    console.error('Failed to initialize Circle wallet session:', err.response?.data || err)
    return NextResponse.json(
      { error: 'Circle Session initialization failed', details: err.response?.data?.message || err.message },
      { status: 500 }
    )
  }
}
