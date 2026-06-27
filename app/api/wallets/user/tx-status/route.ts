import { NextRequest, NextResponse } from 'next/server'
import { initiateUserControlledWalletsClient } from '@circle-fin/user-controlled-wallets'

export const dynamic = 'force-dynamic'

const circleClient = initiateUserControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY!,
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')
    const challengeId = searchParams.get('challengeId')

    if (!email || !challengeId) {
      return NextResponse.json({ error: 'Email and challengeId are required' }, { status: 400 })
    }

    const userId = email.toLowerCase().trim()

    // 1. Generate User Token
    const tokenRes = await circleClient.createUserToken({ userId })
    const { userToken } = (tokenRes.data as any) || {}

    // 2. Query the challenge to get correlationIds (transactionId)
    //    In User-Controlled Wallets, the Challenge object's correlationIds
    //    contains the transactionId AFTER the user has signed (executed) the challenge.
    const challengeRes = await circleClient.getUserChallenge({
      userToken,
      challengeId
    })

    const challenge = challengeRes.data?.challenge
    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    // If challenge is still pending or in-progress, the user hasn't signed yet
    if (challenge.status === 'PENDING' || challenge.status === 'IN_PROGRESS') {
      return NextResponse.json({
        success: true,
        state: 'PENDING',
        challengeStatus: challenge.status,
        txHash: null
      })
    }

    // If challenge failed or expired
    if (challenge.status === 'FAILED' || challenge.status === 'EXPIRED') {
      return NextResponse.json({
        success: true,
        state: 'FAILED',
        challengeStatus: challenge.status,
        txHash: null,
        errorDetails: challenge.errorMessage || `Challenge ${challenge.status}`
      })
    }

    // Challenge is COMPLETE — extract transactionId from correlationIds
    const transactionId = challenge.correlationIds?.[0]
    if (!transactionId) {
      // Challenge completed but no correlationId yet — might be propagating
      return NextResponse.json({
        success: true,
        state: 'INITIATED',
        challengeStatus: challenge.status,
        txHash: null
      })
    }

    // 3. Query the actual transaction status using the resolved transactionId
    const txRes = await circleClient.getTransaction({
      userToken,
      id: transactionId
    })

    const transaction = txRes.data?.transaction
    if (!transaction) {
      return NextResponse.json({
        success: true,
        state: 'INITIATED',
        txHash: null
      })
    }

    console.log(`[Circle Tx Status] ChallengeID: ${challengeId}, TxID: ${transactionId}, State: ${transaction.state}, Hash: ${transaction.txHash}`)

    return NextResponse.json({
      success: true,
      state: transaction.state,
      txHash: transaction.txHash || null,
      transactionId,
      errorDetails: transaction.errorDetails || null
    })

  } catch (err: any) {
    console.error('Failed to retrieve Circle wallet transaction status:', err.response?.data || err)
    
    // Differentiate transient vs permanent errors for smarter client retry
    const circleStatus = err.response?.status
    const isTransient = circleStatus === 429 || circleStatus === 503 || circleStatus === 504 || err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT'
    
    return NextResponse.json(
      { 
        error: 'Circle transaction status query failed', 
        details: err.response?.data?.message || err.message,
        retryable: isTransient
      },
      { status: isTransient ? 503 : 500 }
    )
  }
}
