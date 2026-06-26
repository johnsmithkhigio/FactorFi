import { createWalletClient, createPublicClient, http, defineChain, parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] } },
});

const FACTORFI_ADDRESS = process.env.FACTORFI_ADDRESS || '0xf3aceefa36e2c8a501eaef9b44df8859159800ed';
const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';

async function main() {
  console.log('🌱 Starting FactorFi Data Seed (Single Wallet Mode)...');

  const publicClient = createPublicClient({ chain: arcTestnet, transport: http() });
  
  const deployerAccount = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}`);
  const wallet = createWalletClient({ account: deployerAccount, chain: arcTestnet, transport: http() });
  
  console.log('Wallet:', deployerAccount.address);

  const waitForTx = async (hash) => {
    process.stdout.write(`Waiting for tx ${hash.slice(0,10)}... `);
    await publicClient.waitForTransactionReceipt({ hash });
    console.log('✅');
  };

  const { encodeFunctionData } = await import('viem');

  // 1. Register Anchor (if not already)
  try {
    console.log('\n🏢 Registering Anchor...');
    const regData = encodeFunctionData({
      abi: [{ name: 'registerAnchor', type: 'function', inputs: [{type: 'string'}, {type: 'uint256'}] }],
      args: ['GlobalTrade Corp', 980n]
    });
    const hash = await wallet.sendTransaction({ to: FACTORFI_ADDRESS, data: regData });
    await waitForTx(hash);
  } catch (e) {
    console.log('Already registered or failed. Continuing...');
  }

  // 2. Submit Invoices
  console.log('\n📄 Submitting Invoices...');
  const thirtyDays = BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60);

  // Generate invoice hash and signature to comply with AI Underwriter checks
  const invoiceHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
  const signature = await deployerAccount.signMessage({
    message: { raw: invoiceHash }
  });
  
  const subData = encodeFunctionData({
    abi: [{ 
      name: 'submitInvoice', 
      type: 'function', 
      inputs: [
        { name: '_anchor', type: 'address' },
        { name: '_amount', type: 'uint256' },
        { name: '_dueDate', type: 'uint256' },
        { name: '_description', type: 'string' },
        { name: '_invoiceHash', type: 'bytes32' },
        { name: '_signature', type: 'bytes' },
        { name: '_token', type: 'address' }
      ] 
    }],
    args: [
      deployerAccount.address, 
      parseUnits('0.1', 6), 
      thirtyDays, 
      'Cloud Hosting Services Q4',
      invoiceHash,
      signature,
      USDC_ADDRESS
    ]
  });
  let hash = await wallet.sendTransaction({ to: FACTORFI_ADDRESS, data: subData });
  await waitForTx(hash);

  // 3. Get latest ID
  const invoiceCountData = await publicClient.readContract({
    address: FACTORFI_ADDRESS,
    abi: [{ name: 'nextInvoiceId', type: 'function', inputs: [], outputs: [{type:'uint256'}] }],
    functionName: 'nextInvoiceId'
  });
  const id = Number(invoiceCountData) - 1;
  console.log('Latest Invoice ID:', id);

  // 4. Approve Invoice
  console.log('\n✅ Approving Invoice...');
  const appData = encodeFunctionData({
    abi: [{ name: 'approveInvoice', type: 'function', inputs: [{type:'uint256'}] }],
    args: [BigInt(id)]
  });
  hash = await wallet.sendTransaction({ to: FACTORFI_ADDRESS, data: appData });
  await waitForTx(hash);

  // 5. Fund Invoice
  console.log('\n💰 Funding Invoice...');
  const approveData = encodeFunctionData({
    abi: [{ name: 'approve', type: 'function', inputs: [{type:'address'}, {type:'uint256'}] }],
    args: [FACTORFI_ADDRESS, parseUnits('100', 6)]
  });
  hash = await wallet.sendTransaction({ to: USDC_ADDRESS, data: approveData });
  await waitForTx(hash);

  const fundData = encodeFunctionData({
    abi: [{ name: 'fundInvoice', type: 'function', inputs: [{type:'uint256'}, {type:'uint256'}] }],
    args: [BigInt(id), 200n] // 2% discount
  });
  hash = await wallet.sendTransaction({ to: FACTORFI_ADDRESS, data: fundData });
  await waitForTx(hash);

  // 6. Settle Invoice
  console.log('\n🏦 Settling Invoice...');
  const settleData = encodeFunctionData({
    abi: [{ name: 'settleInvoice', type: 'function', inputs: [{type:'uint256'}] }],
    args: [BigInt(id)]
  });
  hash = await wallet.sendTransaction({ to: FACTORFI_ADDRESS, data: settleData });
  await waitForTx(hash);

  console.log('\n🎉 Seed complete! Dashboard should now show real stats, settled volume, and a lively event feed.');
}

main().catch(console.error);
