'use client'

import React, { useState } from 'react'
import { Check, Copy, Code, Terminal, FileCode, HardDrive, Cpu } from 'lucide-react'

type Language = 'js' | 'ts' | 'python' | 'go' | 'rust' | 'curl'

export default function ExamplesDocsClient() {
  const [activeLang, setActiveLang] = useState<Language>('ts')
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(text)
    setTimeout(() => setCopiedText(null), 2000)
  }

  // Code snippets database
  const snippets: Record<Language, { deposit: string; sign: string; webhook: string }> = {
    ts: {
      deposit: `import { ethers } from 'ethers';\n\nconst VAULT_ABI = ["function deposit(uint256 amount) external returns (uint256)"];\nconst usdcAbi = ["function approve(address spender, uint256 amount) external returns (bool)"];\n\nasync function depositToVault(amountUSDC: string) {\n  const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");\n  const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);\n  \n  const amount = ethers.parseUnits(amountUSDC, 6);\n  const usdcContract = new ethers.Contract("0x0f2d5ce4831fc3a1d9553c69ee8bba8721d13cea", usdcAbi, signer);\n  \n  console.log("Approving USDC spend...");\n  await (await usdcContract.approve(process.env.VAULT_ADDRESS!, amount)).wait();\n  \n  const vaultContract = new ethers.Contract(process.env.VAULT_ADDRESS!, VAULT_ABI, signer);\n  console.log("Depositing funds...");\n  const tx = await vaultContract.deposit(amount);\n  const receipt = await tx.wait();\n  console.log("Success! Tx hash:", receipt.hash);\n}`,
      sign: `import { ethers } from 'ethers';\n\nasync function signInvoiceHash(invoiceId: string, amount: string) {\n  const messageHash = ethers.solidityPackedKeccak256(\n    ['string', 'uint256'],\n    [invoiceId, ethers.parseUnits(amount, 6)]\n  );\n  \n  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!);\n  const signature = await wallet.signMessage(ethers.getBytes(messageHash));\n  console.log("Signature generated:", signature);\n  return signature;\n}`,
      webhook: `import express from 'express';\nimport crypto from 'crypto';\n\nconst app = express();\napp.use(express.json());\n\napp.post('/webhook', (req, res) => {\n  const signature = req.headers['x-circle-signature'];\n  const computedHmac = crypto\n    .createHmac('sha256', process.env.CIRCLE_WEBHOOK_SECRET!)\n    .update(JSON.stringify(req.body))\n    .digest('hex');\n    \n  if (signature !== computedHmac) {\n    return res.status(401).send("Invalid HMAC Signature");\n  }\n  \n  console.log("Validated Webhook payment reconciled:", req.body.data.transactionHash);\n  res.sendStatus(200);\n});`
    },
    js: {
      deposit: `const { ethers } = require('ethers');\n\nasync function depositToVault(amountUSDC) {\n  const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");\n  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);\n  const amount = ethers.parseUnits(amountUSDC, 6);\n  // Approve and deposit using standard ethers calls...\n}`,
      sign: `const { ethers } = require('ethers');\n\nasync function signInvoiceHash(invoiceId, amount) {\n  const messageHash = ethers.solidityPackedKeccak256(\n    ['string', 'uint256'],\n    [invoiceId, ethers.parseUnits(amount, 6)]\n  );\n  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);\n  return await wallet.signMessage(ethers.getBytes(messageHash));\n}`,
      webhook: `const express = require('express');\nconst crypto = require('crypto');\nconst app = express();\napp.use(express.json());\n// Verify x-circle-signature header and compute hmac...`
    },
    python: {
      deposit: `from web3 import Web3\n\nw3 = Web3(Web3.HTTPProvider("https://rpc.testnet.arc.network"))\n# Load contract ABIs and perform approval and deposit transactions...`,
      sign: `from eth_account.messages import encode_defunct\nfrom web3 import Web3\n\ndef sign_invoice(invoice_id, amount):\n    msg_hash = Web3.solidity_keccak(['string', 'uint256'], [invoice_id, int(amount * 10**6)])\n    message = encode_defunct(hexstr=msg_hash.hex())\n    signed_message = w3.eth.account.sign_message(message, private_key=private_key)\n    return signed_message.signature.hex()`,
      webhook: `from flask import Flask, request, jsonify\nimport hmac, hashlib\n\napp = Flask(__name__)\n\n@app.route('/webhook', methods=['POST'])\ndef webhook():\n    signature = request.headers.get('X-Circle-Signature')\n    # Verify payload integrity using circle secret...`
    },
    go: {
      deposit: `package main\n\nimport (\n\t"context"\n\t"github.com/ethereum/go-ethereum/ethclient"\n)\n\nfunc main() {\n\tclient, _ := ethclient.Dial("https://rpc.testnet.arc.network")\n\t// Initialize contract bindings and send transaction...\n}`,
      sign: `package main\n\nimport (\n\t"github.com/ethereum/go-ethereum/crypto"\n)\n\nfunc signInvoice(invoiceId string, amount int64) []byte {\n\t// Compute packed keccak256 hash and sign using ECDSA...\n\treturn nil\n}`,
      webhook: `package main\n\nimport (\n\t"crypto/hmac"\n\t"crypto/sha256"\n\t"net/http"\n)\n// Handle HTTP request, verify HMAC header signature...`
    },
    rust: {
      deposit: `use ethers::prelude::*;\n\nasync fn deposit_usdc() -> Result<(), Box<dyn std::error::Error>> {\n    let provider = Provider::<Http>::try_from("https://rpc.testnet.arc.network")?;\n    // Set up client middleware and submit transaction...\n    Ok(())\n}`,
      sign: `use ethers::utils::keccak256;\n\nfn sign_invoice_hash(invoice_id: &str, amount: u64) -> Signature {\n    // Hash invoice details and sign with local signing key...\n}`,
      webhook: `// Rust Axum or Actix web controller, verify header HMAC byte arrays...`
    },
    curl: {
      deposit: `# Underwrite invoice via REST API Relayer\ncurl -X POST https://localhost:3000/api/invoices \\\n  -H "Content-Type: application/json" \\\n  -d '{"invoiceId": "inv_901", "amount": "1500.00", "anchor": "0x627..."}'`,
      sign: `# Fetch dynamic fee quote before signing\ncurl -X GET "https://localhost:3000/api/stablefx/quote?from=EURC&to=USDC&amount=100"`,
      webhook: `# Mock webhook payload to test local relayer reconciliation endpoint\ncurl -X POST http://localhost:3000/api/webhook \\\n  -H "Content-Type: application/json" \\\n  -H "X-Circle-Signature: MOCK_HMAC_SHA256_HEX_SIGNATURE" \\\n  -d '{"id":"evt_001", "type":"contract_event", "data":{"amount":"1500.00"}}'`
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
      
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', color: '#fff', marginBottom: 12 }}>
          Code Examples Hub
        </h1>
        <p style={{ fontSize: 15, color: 'var(--ff-text-secondary)', lineHeight: 1.6 }}>
          Explore language-specific implementation patterns. Select your preferred integration stacks below to copy complete code blocks.
        </p>
      </div>

      {/* Language Switcher tabs */}
      <div style={{ display: 'flex', gap: 6, background: 'rgba(0,0,0,0.15)', padding: 4, borderRadius: 8, border: '1px solid var(--ff-border)' }}>
        {[
          { id: 'ts', label: 'TypeScript', icon: <FileCode size={14} /> },
          { id: 'js', label: 'JavaScript', icon: <Code size={14} /> },
          { id: 'python', label: 'Python', icon: <Terminal size={14} /> },
          { id: 'go', label: 'Go', icon: <HardDrive size={14} /> },
          { id: 'rust', label: 'Rust', icon: <Cpu size={14} /> },
          { id: 'curl', label: 'cURL / HTTP', icon: <Terminal size={14} /> }
        ].map(lang => (
          <button
            key={lang.id}
            onClick={() => setActiveLang(lang.id as Language)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: activeLang === lang.id ? 'rgba(56,189,248,0.1)' : 'transparent',
              border: 'none',
              borderRadius: 6,
              color: activeLang === lang.id ? 'var(--ff-primary)' : 'var(--ff-text-muted)',
              padding: '10px 12px',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all var(--ff-transition)'
            }}
          >
            {lang.icon}
            {lang.label}
          </button>
        ))}
      </div>

      {/* Code Blocks list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        
        {/* Vault Deposit */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, color: '#fff', fontWeight: 600 }}>1. Deposit Liquidity to USDC Vault</h3>
            <button
              onClick={() => handleCopy(snippets[activeLang].deposit)}
              style={{ background: 'none', border: 'none', color: 'var(--ff-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
            >
              {copiedText === snippets[activeLang].deposit ? <Check size={14} color="var(--ff-success)" /> : <Copy size={14} />}
              <span>Copy code</span>
            </button>
          </div>
          <pre style={{
            background: '#000',
            padding: 20,
            borderRadius: 8,
            overflowX: 'auto',
            fontFamily: 'var(--ff-mono)',
            fontSize: 12,
            color: '#a78bfa',
            border: '1px solid var(--ff-border)'
          }}>{snippets[activeLang].deposit}</pre>
        </div>

        {/* Invoice Signing */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, color: '#fff', fontWeight: 600 }}>2. Cryptographic Invoice Signing</h3>
            <button
              onClick={() => handleCopy(snippets[activeLang].sign)}
              style={{ background: 'none', border: 'none', color: 'var(--ff-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
            >
              {copiedText === snippets[activeLang].sign ? <Check size={14} color="var(--ff-success)" /> : <Copy size={14} />}
              <span>Copy code</span>
            </button>
          </div>
          <pre style={{
            background: '#000',
            padding: 20,
            borderRadius: 8,
            overflowX: 'auto',
            fontFamily: 'var(--ff-mono)',
            fontSize: 12,
            color: 'var(--ff-primary)',
            border: '1px solid var(--ff-border)'
          }}>{snippets[activeLang].sign}</pre>
        </div>

        {/* Webhook Handling */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, color: '#fff', fontWeight: 600 }}>3. Handle Webhook Reconciliation Verification</h3>
            <button
              onClick={() => handleCopy(snippets[activeLang].webhook)}
              style={{ background: 'none', border: 'none', color: 'var(--ff-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
            >
              {copiedText === snippets[activeLang].webhook ? <Check size={14} color="var(--ff-success)" /> : <Copy size={14} />}
              <span>Copy code</span>
            </button>
          </div>
          <pre style={{
            background: '#000',
            padding: 20,
            borderRadius: 8,
            overflowX: 'auto',
            fontFamily: 'var(--ff-mono)',
            fontSize: 12,
            color: 'var(--ff-success)',
            border: '1px solid var(--ff-border)'
          }}>{snippets[activeLang].webhook}</pre>
        </div>

      </div>

    </div>
  )
}
