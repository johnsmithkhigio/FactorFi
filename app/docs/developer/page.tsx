'use client'

import React, { useState } from 'react'
import { Terminal, Key, Database, Play, Check, Copy } from 'lucide-react'

export default function DeveloperDocs() {
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(text)
    setTimeout(() => setCopiedText(null), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
      
      {/* Introduction Header */}
      <section id="dev-intro">
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', color: '#fff', marginBottom: 12 }}>
          Developer Hub
        </h1>
        <p style={{ fontSize: 15, color: 'var(--ff-text-secondary)', lineHeight: 1.6 }}>
          Welcome to the FactorFi core developer integration guide. Our APIs, SDK adapters, and smart contracts enable automated reverse-factoring workflows, multi-chain liquidity deposits, and gasless smart wallet automation on the Arc blockchain.
        </p>
      </section>

      {/* Quickstart Guide */}
      <section id="quickstart">
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', marginBottom: 12 }}>
          Quickstart: Settle an Invoice under 5 Minutes
        </h2>
        <p style={{ fontSize: 14, color: 'var(--ff-text-secondary)', marginBottom: 20 }}>
          Follow these steps to configure your environment and call the FactorFi Smart Contract in TypeScript.
        </p>

        {/* Step 1 */}
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Step 1: Install SDK dependencies</h3>
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <pre style={{ background: '#000', padding: '14px 16px', borderRadius: 8, overflowX: 'auto', fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--ff-primary)' }}>
            npm install ethers dotenv @circle-fin/user-controlled-wallets
          </pre>
          <button 
            onClick={() => handleCopy('npm install ethers dotenv @circle-fin/user-controlled-wallets')}
            style={{ position: 'absolute', right: 12, top: 11, background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
          >
            {copiedText === 'npm install ethers dotenv @circle-fin/user-controlled-wallets' ? <Check size={16} color="var(--ff-success)" /> : <Copy size={16} />}
          </button>
        </div>

        {/* Step 2 */}
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Step 2: Setup Environment Variables</h3>
        <p style={{ fontSize: 13.5, color: 'var(--ff-text-secondary)', marginBottom: 8 }}>
          Configure your `.env.local` to connect to the Arc Testnet and set up your Circle Developer Entity secrets.
        </p>
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <pre style={{ background: '#000', padding: '14px 16px', borderRadius: 8, overflowX: 'auto', fontFamily: 'var(--ff-mono)', fontSize: 12, color: '#ccc' }}>
{`# Arc L1 Testnet Configuration
ARC_RPC_URL="https://rpc.testnet.arc.network"
FACTORFI_CONTRACT_ADDRESS="0xc8d9889a6b49e96951309fc0291e652d005be3f9"

# Circle API credentials
CIRCLE_API_KEY="TEST_API_KEY_..."
CIRCLE_WALLET_SET_ID="2e31c6b8-080a-574c-9664-faf2f5ff3535"`}
          </pre>
        </div>

        {/* Step 3 */}
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Step 3: Execute Underwrite Signature</h3>
        <p style={{ fontSize: 13.5, color: 'var(--ff-text-secondary)', marginBottom: 8 }}>
          Create a script to generate a signed EIP-712 invoice representation and submit it to the factor contract.
        </p>
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <pre style={{ background: '#000', padding: '14px 16px', borderRadius: 8, overflowX: 'auto', fontFamily: 'var(--ff-mono)', fontSize: 12, color: '#a78bfa' }}>
{`import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider(process.env.ARC_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

// FactorFi Underwriter ABI fragment
const contractAbi = ["function underwriteInvoice(string invoiceId, uint256 amount, uint256 premiumBps) external returns (bool)"];
const factorContract = new ethers.Contract(process.env.FACTORFI_CONTRACT_ADDRESS!, contractAbi, wallet);

async function signAndUnderwrite() {
  console.log("Submitting invoice...");
  const tx = await factorContract.underwriteInvoice("inv_00918", ethers.parseUnits("500.00", 6), 250);
  const receipt = await tx.wait();
  console.log("Invoice underwritten successfully! Hash:", receipt.hash);
}

signAndUnderwrite();`}
          </pre>
          <button 
            onClick={() => handleCopy('import { ethers } from \'ethers\';\n\nconst provider = new ethers.JsonRpcProvider(process.env.ARC_RPC_URL);\nconst wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);\n\nconst contractAbi = ["function underwriteInvoice(string invoiceId, uint256 amount, uint256 premiumBps) external returns (bool)"];\nconst factorContract = new ethers.Contract(process.env.FACTORFI_CONTRACT_ADDRESS!, contractAbi, wallet);\n\nasync function signAndUnderwrite() {\n  const tx = await factorContract.underwriteInvoice("inv_00918", ethers.parseUnits("500.00", 6), 250);\n  await tx.wait();\n}\n\nsignAndUnderwrite();')}
            style={{ position: 'absolute', right: 12, top: 11, background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
          >
            {copiedText?.includes('signAndUnderwrite') ? <Check size={16} color="var(--ff-success)" /> : <Copy size={16} />}
          </button>
        </div>
      </section>

      {/* Circle Integrations */}
      <section id="circle-wallets">
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', marginBottom: 12 }}>
          Circle Wallet & SDK Integrations
        </h2>
        <p style={{ fontSize: 14, color: 'var(--ff-text-secondary)', marginBottom: 20 }}>
          FactorFi orchestrates funds utilizing a combination of Circle's Programmable Wallets and Smart Contracts.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="circle-grid">
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Key size={18} style={{ color: 'var(--ff-primary)' }} />
              <h4 style={{ fontSize: 14.5, fontWeight: 600, color: '#fff' }}>Developer-Controlled Wallets</h4>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--ff-text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
              Used behind the scenes to hold anchor-approved collateral. Allows the API server to sign payout transactions gaslessly via the Circle SDK on behalf of anchors.
            </p>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Database size={18} style={{ color: 'var(--ff-violet)' }} />
              <h4 style={{ fontSize: 14.5, fontWeight: 600, color: '#fff' }}>CCTP Bridge SDK</h4>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--ff-text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
              Enables LPs on Arbitrum or Base to bridge assets directly. Source tokens are burned, and target chain (Arc) assets are minted automatically in a single unified execution flow.
            </p>
          </div>
        </div>
      </section>

      {/* Arc network config */}
      <section id="arc-setup">
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', marginBottom: 12 }}>
          Arc L1 Chain Configurations
        </h2>
        <p style={{ fontSize: 14, color: 'var(--ff-text-secondary)', marginBottom: 20 }}>
          Connect your Web3 clients (viem, ethers, wagmi) to the Arc L1 test network.
        </p>

        <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 8, padding: 20, border: '1px solid var(--ff-border)', fontSize: 13.5, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--ff-border)', paddingBottom: 8 }}>
            <span style={{ fontWeight: 600 }}>Network Name:</span>
            <span style={{ color: '#fff' }}>Arc Testnet</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--ff-border)', paddingBottom: 8 }}>
            <span style={{ fontWeight: 600 }}>RPC Node URL:</span>
            <span style={{ color: '#fff', fontFamily: 'var(--ff-mono)', fontSize: 12 }}>https://rpc.testnet.arc.network</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--ff-border)', paddingBottom: 8 }}>
            <span style={{ fontWeight: 600 }}>Chain ID:</span>
            <span style={{ color: '#fff' }}>5042002</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--ff-border)', paddingBottom: 8 }}>
            <span style={{ fontWeight: 600 }}>Native Gas Asset:</span>
            <span style={{ color: 'var(--ff-primary)' }}>USDC (6 decimals)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600 }}>Block Explorer:</span>
            <a href="https://testnet.arcscan.app" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ff-primary)', textDecoration: 'none' }}>testnet.arcscan.app</a>
          </div>
        </div>
      </section>

      {/* Global CSS Inject */}
      <style jsx>{`
        @media (max-width: 768px) {
          .circle-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
