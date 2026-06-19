import { createWalletClient, createPublicClient, http, defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import solc from 'solc';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] } },
  blockExplorers: { default: { name: 'Arcscan', url: 'https://testnet.arcscan.app' } },
  testnet: true,
});

async function main() {
  console.log('=== Deploying Secondary Receivables OTC Marketplace contracts ===\n');

  // Load sources
  const nftPath = path.join(__dirname, '..', 'contracts', 'InvoiceReceiptNFT.sol');
  const marketPath = path.join(__dirname, '..', 'contracts', 'FactorFiMarketplace.sol');
  
  const nftSource = fs.readFileSync(nftPath, 'utf8');
  const marketSource = fs.readFileSync(marketPath, 'utf8');

  const input = {
    language: 'Solidity',
    sources: { 
      'InvoiceReceiptNFT.sol': { content: nftSource },
      'FactorFiMarketplace.sol': { content: marketSource }
    },
    settings: {
      viaIR: true,
      optimizer: { enabled: true, runs: 200 },
      outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } },
    },
  };

  console.log('Compiling contracts...');
  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    const errors = output.errors.filter(e => e.severity === 'error');
    if (errors.length > 0) {
      console.error('Compilation errors:');
      errors.forEach(e => console.error(e.formattedMessage));
      process.exit(1);
    }
  }

  const nftContract = output.contracts['InvoiceReceiptNFT.sol']['InvoiceReceiptNFT'];
  const marketContract = output.contracts['FactorFiMarketplace.sol']['FactorFiMarketplace'];

  console.log('Compilation complete.');

  // Set up account
  const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}`);
  console.log('Deployer Account:', account.address);

  const publicClient = createPublicClient({ chain: arcTestnet, transport: http() });
  const walletClient = createWalletClient({ account, chain: arcTestnet, transport: http() });

  const FACTORFI_ADDRESS = process.env.FACTORFI_ADDRESS || '0xf3aceefa36e2c8a501eaef9b44df8859159800ed';

  // 1. Deploy InvoiceReceiptNFT
  console.log('\nDeploying InvoiceReceiptNFT...');
  const { encodeAbiParameters } = await import('viem');
  const nftArgs = encodeAbiParameters(
    [{ type: 'address' }],
    [FACTORFI_ADDRESS]
  );
  const nftDeployData = `0x${nftContract.evm.bytecode.object}` + nftArgs.slice(2);

  const nftHash = await walletClient.deployContract({
    abi: nftContract.abi,
    bytecode: nftDeployData,
    args: [],
  });
  console.log('InvoiceReceiptNFT deployment tx:', nftHash);
  
  const nftReceipt = await publicClient.waitForTransactionReceipt({ hash: nftHash });
  const nftAddress = nftReceipt.contractAddress;
  console.log('🎉 InvoiceReceiptNFT deployed to:', nftAddress);

  // 2. Deploy FactorFiMarketplace
  console.log('\nDeploying FactorFiMarketplace...');
  const marketArgs = encodeAbiParameters(
    [{ type: 'address' }, { type: 'address' }],
    [FACTORFI_ADDRESS, nftAddress]
  );
  const marketDeployData = `0x${marketContract.evm.bytecode.object}` + marketArgs.slice(2);

  const marketHash = await walletClient.deployContract({
    abi: marketContract.abi,
    bytecode: marketDeployData,
    args: [],
  });
  console.log('FactorFiMarketplace deployment tx:', marketHash);

  const marketReceipt = await publicClient.waitForTransactionReceipt({ hash: marketHash });
  const marketAddress = marketReceipt.contractAddress;
  console.log('🎉 FactorFiMarketplace deployed to:', marketAddress);

  console.log('\n✅ Deployment finished successfully!');
}

main().catch(console.error);
