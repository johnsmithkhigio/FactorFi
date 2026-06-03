import { NextRequest, NextResponse } from 'next/server'
import { GatewayClient } from '@/lib/gateway-client'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const address = searchParams.get('address')

    if (!address) {
      return NextResponse.json({ error: 'Address parameter is required' }, { status: 400 })
    }

    const balance = GatewayClient.getGatewayBalance(address)
    const transactions = GatewayClient.getTransactions(address)

    return NextResponse.json({
      address,
      balance,
      transactions,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { address, amount, txHash } = await req.json()

    if (!address || amount === undefined || amount <= 0) {
      return NextResponse.json({ error: 'Invalid address or amount' }, { status: 400 })
    }

    const result = GatewayClient.depositToGateway(address, amount, txHash)

    return NextResponse.json({
      success: true,
      address,
      newBalance: result.newBalance,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
