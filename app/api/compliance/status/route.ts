import { NextRequest } from 'next/server'
import { Hex, keccak256, encodePacked } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const address = searchParams.get('address')

    if (!address) {
      return Response.json({ error: 'Address query parameter is required' }, { status: 400 })
    }

    let isCompliant = true

    // Real Integration with Circle Compliance screening API
    if (process.env.CIRCLE_API_KEY) {
      try {
        const res = await fetch('https://api.circle.com/v1/compliance/screens', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.CIRCLE_API_KEY}`,
          },
          body: JSON.stringify({
            address,
            chain: 'ARC',
          }),
        })

        if (res.ok) {
          const data = await res.json()
          if (data?.data?.verdict === 'BLOCK' || (data?.data?.riskScore && data.data.riskScore > 75)) {
            isCompliant = false
            console.log(`[Compliance] Address ${address} flagged as non-compliant. Verdict: ${data?.data?.verdict}`)
          }
        } else {
          console.warn(`[Compliance] Screening API returned status: ${res.status}`)
        }
      } catch (err) {
        console.error('[Compliance] Failed to contact Circle Compliance screening API:', err)
      }
    }

    const privateKeyEnv = process.env.PRIVATE_KEY
    if (!privateKeyEnv) {
      return Response.json({ error: 'Server environment missing PRIVATE_KEY configuration' }, { status: 500 })
    }
    const privateKey = (privateKeyEnv.startsWith('0x') ? privateKeyEnv : `0x${privateKeyEnv}`) as Hex
    const account = privateKeyToAccount(privateKey)

    const timestamp = BigInt(Math.floor(Date.now() / 1000))

    // Hash user address, compliance status, and timestamp to prevent replay attacks
    const messageHash = keccak256(
      encodePacked(
        ['address', 'bool', 'uint256'],
        [address as `0x${string}`, isCompliant, timestamp]
      )
    )

    const signature = await account.signMessage({
      message: { raw: messageHash }
    })

    return Response.json({
      address,
      compliant: isCompliant,
      timestamp: timestamp.toString(),
      signature,
    })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
