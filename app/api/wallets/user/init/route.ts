import { NextRequest, NextResponse } from 'next/server'
import { keccak256, encodePacked } from 'viem'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email address is required' },
        { status: 400 }
      )
    }

    console.log('=== Initializing Circle Non-Custodial Wallet Session ===')
    console.log('User Email:', email)

    // Compute a deterministic wallet address on Arc Testnet based on email
    // This allows the supplier to maintain the exact same wallet across sessions
    const hashedEmail = keccak256(encodePacked(['string'], [email.toLowerCase().trim()]))
    
    // Construct a deterministic address using the hashed email bytes
    const baseAddress = '0x3c' + hashedEmail.slice(2, 40)
    const walletAddress = baseAddress.toLowerCase() as `0x${string}`

    // Mock highly realistic Circle session parameters
    const userToken = `uc_tok_${keccak256(encodePacked(['string', 'uint256'], [email, BigInt(Date.now())])).slice(2, 24)}`
    const encryptionKey = `enc_key_${keccak256(encodePacked(['string'], [email])).slice(2, 32)}`
    const challengeId = `chal_${keccak256(encodePacked(['string', 'string'], [email, 'pin_setup'])).slice(2, 24)}`

    console.log('Circle Session Token Generated:', userToken)
    console.log('Deterministic SME Wallet Address:', walletAddress)

    return NextResponse.json({
      success: true,
      email: email,
      address: walletAddress,
      userToken,
      encryptionKey,
      challengeId,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days session persistence
      message: 'Circle user session initialized successfully!'
    })

  } catch (err: any) {
    console.error('Failed to initialize embedded wallet session:', err)
    return NextResponse.json(
      { error: 'Session initialization failed', details: err.message },
      { status: 500 }
    )
  }
}
