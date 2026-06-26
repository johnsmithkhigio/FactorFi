import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const encoder = new TextEncoder()
    const customReadable = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(JSON.stringify({ type: 'log', message: '🚀 Initializing compilation & deployment environment...' }) + '\n'))

        const scriptPath = path.join(process.cwd(), 'scripts', 'deploy-all.js')
        controller.enqueue(encoder.encode(JSON.stringify({ type: 'log', message: `📂 Located deployment script: ${scriptPath}` }) + '\n'))
        
        controller.enqueue(encoder.encode(JSON.stringify({ type: 'log', message: '🛠️ Compiling FactorFi, AutoFactorVault, InvoiceReceiptNFT, and FactorFiMarketplace...' }) + '\n'))

        const processEnv = { ...process.env }
        // Ensure private key starts without 0x for the script if required
        const child = exec(`node "${scriptPath}"`, { env: processEnv })

        child.stdout?.on('data', (data) => {
          const lines = data.toString().split('\n')
          for (const line of lines) {
            if (line.trim()) {
              controller.enqueue(encoder.encode(JSON.stringify({ type: 'log', message: `[deploy] ${line.trim()}` }) + '\n'))
            }
          }
        })

        child.stderr?.on('data', (data) => {
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'error', message: `⚠️ [stderr] ${data.toString().trim()}` }) + '\n'))
        })

        child.on('close', (code) => {
          if (code === 0) {
            controller.enqueue(encoder.encode(JSON.stringify({ type: 'success', message: '🎉 Contract suite deployed and linked successfully!' }) + '\n'))
          } else {
            controller.enqueue(encoder.encode(JSON.stringify({ type: 'error', message: `❌ Deployment failed with exit code ${code}` }) + '\n'))
          }
          controller.close()
        })
      }
    })

    return new Response(customReadable, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error: any) {
    console.error('Error deploying contracts:', error)
    return NextResponse.json({ error: error.message || 'Failed to start deployment' }, { status: 500 })
  }
}
