import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    if (!rawBody) {
      return NextResponse.json({ error: 'Empty request body' }, { status: 400 })
    }

    const payload = JSON.parse(rawBody)
    const snsType = req.headers.get('x-amz-sns-message-type') || payload.Type

    console.log(`[Circle Webhook] Received notification. Type: ${snsType}`)

    // 1. Handle AWS SNS Subscription Confirmation
    if (snsType === 'SubscriptionConfirmation') {
      const subscribeUrl = payload.SubscribeURL
      if (!subscribeUrl) {
        return NextResponse.json({ error: 'Missing SubscribeURL' }, { status: 400 })
      }

      console.log(`[Circle Webhook] Confirming subscription by fetching URL: ${subscribeUrl}`)
      const confirmRes = await fetch(subscribeUrl)
      if (confirmRes.ok) {
        console.log('[Circle Webhook] Subscription confirmed successfully!')
        return NextResponse.json({ success: true, message: 'Subscription confirmed' })
      } else {
        console.error(`[Circle Webhook] Failed to confirm subscription. Status: ${confirmRes.status}`)
        return NextResponse.json({ error: 'Subscription confirmation failed' }, { status: 500 })
      }
    }

    // 2. Handle Circle Notification payloads
    if (snsType === 'Notification') {
      const messageStr = payload.Message
      if (!messageStr) {
        return NextResponse.json({ error: 'Missing Message body' }, { status: 400 })
      }

      const message = JSON.parse(messageStr)
      const eventType = message.notificationType
      const eventData = message.data

      console.log(`[Circle Webhook] Event Type: ${eventType}`)
      console.log('[Circle Webhook] Event Data:', JSON.stringify(eventData, null, 2))

      // Route event processing based on notificationType
      switch (eventType) {
        case 'developer.transaction.updated':
        case 'user.transaction.updated':
          console.log(`[Circle Webhook] Transaction ${eventData.id} state updated to: ${eventData.state}`)
          if (eventData.txHash) {
            console.log(`[Circle Webhook] Tx Hash: ${eventData.txHash}`)
          }
          break

        case 'developer.wallet.created':
        case 'user.wallet.created':
          console.log(`[Circle Webhook] Wallet successfully created! Address: ${eventData.address}`)
          break

        default:
          console.log(`[Circle Webhook] Unhandled event type: ${eventType}`)
      }

      return NextResponse.json({ success: true, eventProcessed: eventType })
    }

    return NextResponse.json({ success: true, message: 'Message received' })

  } catch (err: any) {
    console.error('[Circle Webhook] Error processing notification:', err)
    return NextResponse.json(
      { error: 'Webhook processing failed', details: err.message },
      { status: 500 }
    )
  }
}
