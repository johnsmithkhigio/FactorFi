import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages are required and must be an array' }, { status: 400 })
    }

    const deepseekKey = process.env.DEEPSEEK_API_KEY
    const openaiKey = process.env.OPENAI_API_KEY

    if (!deepseekKey && !openaiKey) {
      const userText = messages[messages.length - 1]?.content?.toLowerCase() || ''
      let replyContent = `🤖 **FactorFi Master Agent (Local Simulator Mode)**\n\nI have analyzed your request in sandbox mode. `
      let actionJson: any = null

      if (userText.includes('register') || userText.includes('buyer')) {
        let rating = 800
        const ratingMatch = userText.match(/\b\d{3}\b/)
        if (ratingMatch) rating = parseInt(ratingMatch[0])
        
        let company = 'Tesla Motors'
        if (userText.includes('apple')) company = 'Apple Inc'
        else if (userText.includes('tesla')) company = 'Tesla Inc'
        else if (userText.includes('microsoft')) company = 'Microsoft Corp'
        
        replyContent += `I will help you register the corporate buyer **${company}** with a credit rating of **${rating}** on the FactorFi credit registry.`
        actionJson = {
          type: "REGISTER_BUYER",
          params: { companyName: company, creditRating: rating }
        }
      }
      else if (userText.includes('swap')) {
        let amount = '100'
        const amountMatch = userText.match(/\b\d+(\.\d+)?\b/)
        if (amountMatch) amount = amountMatch[0]
        let fromToken = 'USDC'
        let toToken = 'EURC'
        if (userText.includes('eurc')) toToken = 'EURC'
        else if (userText.includes('eth')) toToken = 'ETH'
        
        replyContent += `I will execute a token swap to exchange **${amount} ${fromToken}** for **${toToken}** on Arc Testnet.`
        actionJson = {
          type: "SWAP_TOKENS",
          params: { fromToken, toToken, amount, chain: "Arc_Testnet" }
        }
      }
      else if (userText.includes('bridge') && userText.includes('swap')) {
        replyContent += `I have formulated a multi-step execution plan to automate your cross-chain treasury operations:\n\n` +
          `1. **Bridge USDC** from Base Sepolia to Arc Testnet via Circle CCTP.\n` +
          `2. **Swap USDC to EURC** on Arc Testnet.\n` +
          `3. **Transfer EURC** to your Treasury Contract Wallet.`
        actionJson = {
          type: "MULTI_STEP_WORKFLOW",
          params: {
            steps: [
              {
                type: "BRIDGE_TOKENS",
                params: { fromChain: "Base_Sepolia", toChain: "Arc_Testnet", amount: "100", token: "USDC" }
              },
              {
                type: "SWAP_TOKENS",
                params: { fromToken: "USDC", toToken: "EURC", amount: "50", chain: "Arc_Testnet" }
              },
              {
                type: "TRANSFER_ASSETS",
                params: { recipient: "0x32a398da1243c8b991aba311a7db8fd860c234a5", amount: "50", token: "EURC", chain: "Arc_Testnet" }
              }
            ]
          }
        }
      }
      else if (userText.includes('bridge') || userText.includes('move cross-chain')) {
        let amount = '100'
        const amountMatch = userText.match(/\b\d+(\.\d+)?\b/)
        if (amountMatch) amount = amountMatch[0]
        let fromChain = 'Base_Sepolia'
        if (userText.includes('ethereum') || userText.includes('sepolia')) fromChain = 'Ethereum_Sepolia'
        else if (userText.includes('arbitrum')) fromChain = 'Arbitrum_Sepolia'
        
        replyContent += `I will bridge **${amount} USDC** from **${fromChain}** to **Arc Testnet** using Circle CCTP.`
        actionJson = {
          type: "BRIDGE_TOKENS",
          params: { fromChain, toChain: "Arc_Testnet", amount, token: "USDC" }
        }
      }
      else if (userText.includes('transfer') || userText.includes('send to')) {
        let amount = '100'
        const amountMatch = userText.match(/\b\d+(\.\d+)?\b/)
        if (amountMatch) amount = amountMatch[0]
        let recipient = '0x32a398da1243c8b991aba311a7db8fd860c234a5'
        const addrMatch = userText.match(/0x[a-fA-F0-9]{40}/)
        if (addrMatch) recipient = addrMatch[0]
        
        replyContent += `I will transfer **${amount} USDC** to recipient **${recipient}** on Arc Testnet.`
        actionJson = {
          type: "TRANSFER_ASSETS",
          params: { recipient, amount, token: "USDC", chain: "Arc_Testnet" }
        }
      }
      else if (userText.includes('take me') || userText.includes('show my') || userText.includes('go to') || userText.includes('navigate')) {
        let viewId = 'dashboard'
        if (userText.includes('bridge') || userText.includes('history')) viewId = 'bridge'
        else if (userText.includes('invest') || userText.includes('pool')) viewId = 'investor'
        else if (userText.includes('supplier') || userText.includes('factor')) viewId = 'supplier'
        else if (userText.includes('buyer') || userText.includes('anchor')) viewId = 'anchor'
        else if (userText.includes('credit') || userText.includes('passport')) viewId = 'credit'
        else if (userText.includes('agent')) viewId = 'agent'
        
        replyContent += `Redirection action detected. I am initiating automated navigation to the **${viewId}** view module.`
        actionJson = {
          type: "NAVIGATE_TAB",
          params: { viewId }
        }
      }
      else if (userText.includes('report') || userText.includes('passport') || userText.includes('health') || (userText.includes('credit') && !userText.includes('register'))) {
        let company = 'FactorFi Protocol'
        let targetAddr = '0x32a398da1243c8b991aba311a7db8fd860c234a5'
        if (userText.includes('apple')) company = 'Apple Inc'
        else if (userText.includes('tesla')) company = 'Tesla Motors'
        
        replyContent += `📊 **FactorFi Certified Credit & Treasury Report**\n\nI have fetched the on-chain performance records for **${company}** from the Arc Testnet ledger:\n\n` +
          `| Parameter | On-Chain Value | Status |\n` +
          `|---|---|---|\n` +
          `| **Target Address** | \`${targetAddr}\` | Verified |\n` +
          `| **On-Time Settlement Rate** | 94.5% | Exceptional |\n` +
          `| **Weighted Settlement Days** | 12 Days | Fast |\n` +
          `| **Total Amount Factored** | $1,250,000 USDC | Active |\n` +
          `| **Total Amount Settled** | $1,180,000 USDC | Closed |\n` +
          `| **Reputational Credit Score** | 945 / 1000 | A++ Grade |\n\n` +
          `🔒 **Verifiable Cryptographic Proof:**\n` +
          `- Contract Registry: \`0xf3aceefa36e2c8a501eaef9b44df8859159800ed\`\n` +
          `- Certified Verification Token: \`FF_SECURE_PASSPORT_${Buffer.from(targetAddr).toString('base64').slice(0, 12)}\`\n\n` +
          `💡 You can download the official **Cryptographic Credit Passport PDF Certificate** for this address directly from the **Credit Registry** tab, or query any corporate relayer/buyer address dynamically. To check protocol-wide fee allocations, visit the **Treasury Dashboard** tab.`
      }
      else if (userText.includes('treasury') || userText.includes('init') || userText.includes('initialize')) {
        let company = 'Tesla Treasury'
        if (userText.includes('apple')) company = 'Apple Treasury'
        else if (userText.includes('tesla')) company = 'Tesla Treasury'
        
        replyContent += `I will deploy a programmatic corporate treasury contract wallet for **${company}** managed via secure Circle KMS Developer Controlled Wallets.`
        actionJson = {
          type: "INIT_TREASURY",
          params: { companyName: company, creditRating: 900 }
        }
      }
      else if (userText.includes('submit') || userText.includes('invoice')) {
        let amount = '150000'
        const amountMatch = userText.match(/\b\d+(\.\d+)?\b/)
        if (amountMatch) amount = amountMatch[0]
        
        replyContent += `I will help you submit a trade receivable invoice of **${amount} USDC** to your corporate anchor. The gas fee will be sponsored via Circle Gas Station.`
        actionJson = {
          type: "SUBMIT_INVOICE",
          params: {
            anchor: "0x32a398da1243c8b991aba311a7db8fd860c234a5",
            amount: amount,
            dueDate: new Date(Date.now() + 60*24*60*60*1000).toISOString().split('T')[0],
            description: "Silicon Wafer Supply Q3 Shipment"
          }
        }
      }
      else if (userText.includes('deploy') || userText.includes('contract') || userText.includes('project')) {
        replyContent += `I will compile and deploy the FactorFi Smart Contract suite (Registry, Escrow, and Matchmaker Vaults) to the Arc Testnet Network.`
        actionJson = {
          type: "DEPLOY_CONTRACT"
        }
      }
      else if (userText.includes('verify') || userText.includes('kyc')) {
        replyContent += `I will execute an on-chain verification update on the compliance registry for your wallet address.`
        actionJson = {
          type: "VERIFY_WALLET"
        }
      }
      else if (userText.includes('readme') || userText.includes('documentation')) {
        replyContent += `I will construct an exhaustive integration guide and README document for this project codebase.`
        actionJson = {
          type: "GENERATE_README"
        }
      }
      else if (userText.includes('analyze') || userText.includes('repo')) {
        replyContent += `I will scan all TypeScript files, Solidity contracts, and config configurations in the repository for best practices and security audits.`
        actionJson = {
          type: "ANALYZE_REPO"
        }
      }
      else if (userText.includes('api') || userText.includes('key')) {
        replyContent += `I will generate a secure authorization bearer token to plug your corporate ERP system directly into the FactorFi API routing.`
        actionJson = {
          type: "CREATE_API_KEY"
        }
      }
      else {
        replyContent += `I am ready to run any of the primary FactorFi workspace actions. Please select one of the action cards below, or ask me directly to:\n\n1. **Register Buyer Account**\n2. **Initialize Treasury Wallet**\n3. **Submit Trade Invoice**\n4. **Deploy Smart Contract Suite**\n5. **Verify Wallet Compliance**\n6. **Swap Tokens**\n7. **Bridge stablecoins via CCTP**\n8. **Transfer Assets**`
      }
 
      if (actionJson) {
        replyContent += `\n\nTo continue, please review the parameters and submit the action form below:\n\n\`\`\`json\n{\n  "action": {\n    "type": "${actionJson.type}",\n    "params": ${JSON.stringify(actionJson.params || {})} \n  }\n}\n\`\`\``
      }
 
      return NextResponse.json({
        content: replyContent,
        provider: 'FactorFi-Local',
        model: 'Simulated-Cognitive-Router'
      })
    }
 
    const systemPrompt = `You are the FactorFi Master Agent, an enterprise-grade AI assistant running on the ARC Network and Circle Web3 Stack.
Your goal is to assist users (Suppliers, Buyers, and Investors) in managing their invoice financing workflows, checking debtor credit risk, monitoring matching pools, and executing gasless stablecoin settlements.
 
You have access to the following protocol actions:
1. **REGISTER_BUYER**: Register a corporate buyer on-chain. Fields: companyName, creditRating (0-1000).
2. **INIT_TREASURY**: Deploy a programmatic corporate treasury wallet. Fields: companyName.
3. **SUBMIT_INVOICE**: Submit a trade invoice for factoring/financing. Fields: anchorAddress, amount, dueDate (YYYY-MM-DD), description.
4. **DEPLOY_CONTRACT**: Compile and deploy the FactorFi smart contract suite.
5. **VERIFY_WALLET**: Verify the user wallet for compliance and KYC registry.
6. **GENERATE_README**: Generate a professional README markdown file for this repository.
7. **ANALYZE_REPO**: Perform a codebase and smart contract architecture scan on the repository.
8. **CREATE_API_KEY**: Generate API keys and access tokens for a corporate treasury wallet.
9. **SWAP_TOKENS**: Swap one token for another on same-chain. Fields: fromToken (e.g. 'USDC', 'EURC', 'ETH'), toToken (e.g. 'USDC', 'EURC', 'ETH'), amount, chain (e.g. 'Arc_Testnet', 'Ethereum_Sepolia', 'Base_Sepolia', 'Arbitrum_Sepolia').
10. **BRIDGE_TOKENS**: Cross-chain bridge USDC using Circle CCTP or App Kit. Fields: fromChain (e.g. 'Ethereum_Sepolia', 'Base_Sepolia', 'Arbitrum_Sepolia'), toChain (e.g. 'Arc_Testnet'), amount, token (default 'USDC').
11. **TRANSFER_ASSETS**: Transfer stablecoins or assets. Fields: recipient, amount, token (e.g. 'USDC'), chain (default 'Arc_Testnet').
12. **NAVIGATE_TAB**: Perform automated client-side routing redirection to a view/tab. Fields: viewId (e.g. 'dashboard', 'supplier', 'anchor', 'investor', 'bridge', 'credit', 'agent').
13. **MULTI_STEP_WORKFLOW**: Complex sequenced operations spanning across multiple steps (e.g. bridge then swap then send). Fields: steps (array of step objects, e.g. [{"type": "BRIDGE_TOKENS", "params": {...}}, {"type": "SWAP_TOKENS", "params": {...}}, {"type": "TRANSFER_ASSETS", "params": {...}}]).

If the user wants to run, query, or initiate any of these actions, you MUST append a JSON block at the very end of your response inside a standard markdown code block:
\`\`\`json
{
  "action": {
    "type": "REGISTER_BUYER" | "INIT_TREASURY" | "SUBMIT_INVOICE" | "DEPLOY_CONTRACT" | "VERIFY_WALLET" | "GENERATE_README" | "ANALYZE_REPO" | "CREATE_API_KEY" | "SWAP_TOKENS" | "BRIDGE_TOKENS" | "TRANSFER_ASSETS" | "NAVIGATE_TAB" | "MULTI_STEP_WORKFLOW",
    "params": {
      "companyName": "string",
      "creditRating": number,
      "anchorAddress": "string",
      "amount": "string",
      "dueDate": "string",
      "description": "string",
      "fromToken": "string",
      "toToken": "string",
      "fromChain": "string",
      "toChain": "string",
      "token": "string",
      "recipient": "string",
      "viewId": "string",
      "steps": "array"
    }
  }
}
\`\`\`
 
If any parameter is missing, ask the user to provide it, but still output the JSON block with whatever parameters are currently known, so the UI can render the interactive action form. Be professional, direct, and outcome-oriented. Present complex parameters using markdown tables or bullet points. Avoid blockchain hype; focus on business metrics.
For view redirections, suggest it clearly and output NAVIGATE_TAB with appropriate viewId. For composite sequences like "bridge to Arbitrum and swap to ETH", map out a MULTI_STEP_WORKFLOW.`
 
    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role || 'user',
        content: m.content || ''
      }))
    ]
 
    // 1. Try DeepSeek Chat Completions
    if (deepseekKey) {
      try {
        console.log('[Agent API] Trying DeepSeek Chat API...')
        const response = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${deepseekKey}`
          },
          body: JSON.stringify({
            model: 'deepseek-v4-flash',
            messages: formattedMessages,
            temperature: 0.2,
            max_tokens: 1500
          })
        })
 
        if (response.ok) {
          const data = await response.json()
          const content = data.choices?.[0]?.message?.content
          if (content) {
            console.log('[Agent API] DeepSeek Chat response succeeded.')
            return NextResponse.json({
              content,
              provider: 'FactorFi',
              model: 'FactorFi-Core'
            })
          }
        } else {
          const text = await response.text()
          console.warn(`[Agent API] DeepSeek error: status ${response.status}, message: ${text}`)
        }
      } catch (err: any) {
        console.warn(`[Agent API] DeepSeek connection error: ${err.message}. Falling back to OpenAI...`)
      }
    }
 
    // 2. Try OpenAI Fallback
    if (openaiKey) {
      try {
        console.log('[Agent API] Trying OpenAI Chat API fallback...')
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: formattedMessages,
            temperature: 0.2,
            max_tokens: 1500
          })
        })
 
        if (response.ok) {
          const data = await response.json()
          const content = data.choices?.[0]?.message?.content
          if (content) {
            console.log('[Agent API] OpenAI Chat response succeeded.')
            return NextResponse.json({
              content,
              provider: 'FactorFi',
              model: 'FactorFi-Enterprise'
            })
          }
        } else {
          const text = await response.text()
          console.error(`[Agent API] OpenAI error: status ${response.status}, message: ${text}`)
        }
      } catch (err: any) {
        console.error(`[Agent API] OpenAI connection error: ${err.message}`)
      }
    }
 
    return NextResponse.json({
      error: 'All LLM service providers failed to process the request.'
    }, { status: 500 })
 
  } catch (error: any) {
    console.error('Agent chat endpoint error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
