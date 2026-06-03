import { NextRequest } from 'next/server';
import { Hex, keccak256, encodePacked } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');
    const mockStatus = searchParams.get('mockStatus');

    if (!address) {
      return Response.json({ error: 'Address query parameter is required' }, { status: 400 });
    }

    let isCompliant = true;

    // 1. Dynamic mock status check
    if (mockStatus === 'false') {
      isCompliant = false;
    } else if (mockStatus === 'true') {
      isCompliant = true;
    } else if (process.env.CIRCLE_API_KEY) {
      // 2. Real Integration with Circle Compliance screening API
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
        });

        if (res.ok) {
          const data = await res.json();
          // Adjust checks based on actual API response properties (e.g. risk score, verdict)
          if (data?.data?.verdict === 'BLOCK' || (data?.data?.riskScore && data.data.riskScore > 75)) {
            isCompliant = false;
          }
        }
      } catch (err) {
        console.error('Failed to contact Circle Compliance screening API:', err);
      }
    }

    // 3. Cryptographically sign the result
    const privateKeyEnv = process.env.PRIVATE_KEY || 'ab36f14aa3ee9f3d8b9ae51ef9322ec82fd3277a977d880c29203695b0966295';
    const privateKey = (privateKeyEnv.startsWith('0x') ? privateKeyEnv : `0x${privateKeyEnv}`) as Hex;
    const account = privateKeyToAccount(privateKey);

    const timestamp = BigInt(Math.floor(Date.now() / 1000));

    // Hash user address, compliance status, and timestamp to prevent replay attacks
    const messageHash = keccak256(
      encodePacked(
        ['address', 'bool', 'uint256'],
        [address as `0x${string}`, isCompliant, timestamp]
      )
    );

    const signature = await account.signMessage({
      message: { raw: messageHash }
    });

    return Response.json({
      address,
      compliant: isCompliant,
      timestamp: timestamp.toString(),
      signature,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
