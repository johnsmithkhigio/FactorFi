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
  console.log('=== Combined FactorFi Complete Suite Deployment ===\n');

  // Load contract files
  const factorFiPath = path.join(__dirname, '..', 'contracts', 'FactorFi.sol');
  const vaultPath = path.join(__dirname, '..', 'contracts', 'AutoFactorVault.sol');
  const nftPath = path.join(__dirname, '..', 'contracts', 'InvoiceReceiptNFT.sol');
  const marketplacePath = path.join(__dirname, '..', 'contracts', 'FactorFiMarketplace.sol');

  const factorFiSource = fs.readFileSync(factorFiPath, 'utf8');
  const vaultSource = fs.readFileSync(vaultPath, 'utf8');
  const nftSource = fs.readFileSync(nftPath, 'utf8');
  const marketplaceSource = fs.readFileSync(marketplacePath, 'utf8');

  const input = {
    language: 'Solidity',
    sources: { 
      'FactorFi.sol': { content: factorFiSource },
      'AutoFactorVault.sol': { content: vaultSource },
      'InvoiceReceiptNFT.sol': { content: nftSource },
      'FactorFiMarketplace.sol': { content: marketplaceSource }
    },
    settings: {
      viaIR: true,
      optimizer: { enabled: true, runs: 200 },
      outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } },
    },
  };

  console.log('Compiling all 4 contracts via solc...');
  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    const errors = output.errors.filter(e => e.severity === 'error');
    if (errors.length > 0) {
      console.error('Compilation errors:');
      errors.forEach(e => console.error(e.formattedMessage));
      process.exit(1);
    }
  }

  const factorFiContract = output.contracts['FactorFi.sol']['FactorFi'];
  const vaultContract = output.contracts['AutoFactorVault.sol']['AutoFactorVault'];
  const nftContract = output.contracts['InvoiceReceiptNFT.sol']['InvoiceReceiptNFT'];
  const marketplaceContract = output.contracts['FactorFiMarketplace.sol']['FactorFiMarketplace'];

  console.log('All contracts compiled successfully.');

  // Set up account
  const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY.replace(/^0x/, '')}`);
  console.log('Deployer Account:', account.address);

  const publicClient = createPublicClient({ chain: arcTestnet, transport: http() });
  const walletClient = createWalletClient({ account, chain: arcTestnet, transport: http() });

  // Check balance
  const balance = await publicClient.getBalance({ address: account.address });
  console.log('Deployer Gas Balance:', (Number(balance) / 1e18).toFixed(6), 'USDC (gas)');

  if (balance === 0n) {
    console.error('\n❌ No balance! Deployer needs gas to execute transactions.');
    process.exit(1);
  }

  const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';
  const EURC_ADDRESS = '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a';
  const PROTOCOL_FEE_BPS = 50n; // 0.5%

  const { encodeAbiParameters } = await import('viem');

  // 1. Deploy FactorFi
  console.log('\n[1/4] Deploying FactorFi...');
  const factorFiArgs = encodeAbiParameters(
    [{ type: 'address[]' }, { type: 'uint256' }],
    [[USDC_ADDRESS, EURC_ADDRESS], PROTOCOL_FEE_BPS]
  );
  const factorFiDeployData = `0x${factorFiContract.evm.bytecode.object}` + factorFiArgs.slice(2);
  const factorFiHash = await walletClient.deployContract({
    abi: factorFiContract.abi,
    bytecode: factorFiDeployData,
    args: [],
  });
  console.log('FactorFi Tx:', factorFiHash);
  const factorFiReceipt = await publicClient.waitForTransactionReceipt({ hash: factorFiHash });
  const factorFiAddress = factorFiReceipt.contractAddress;
  console.log('🎉 FactorFi deployed at:', factorFiAddress);

  // 2. Deploy AutoFactorVault
  console.log('\n[2/4] Deploying AutoFactorVault...');
  const vaultArgs = encodeAbiParameters(
    [{ type: 'address' }, { type: 'address' }, { type: 'string' }, { type: 'string' }],
    [USDC_ADDRESS, factorFiAddress, 'FactorFi Yield Vault', 'ffUSDC']
  );
  const vaultDeployData = `0x${vaultContract.evm.bytecode.object}` + vaultArgs.slice(2);
  const vaultHash = await walletClient.deployContract({
    abi: vaultContract.abi,
    bytecode: vaultDeployData,
    args: [],
  });
  console.log('AutoFactorVault Tx:', vaultHash);
  const vaultReceipt = await publicClient.waitForTransactionReceipt({ hash: vaultHash });
  const vaultAddress = vaultReceipt.contractAddress;
  console.log('🎉 AutoFactorVault deployed at:', vaultAddress);

  // 3. Deploy InvoiceReceiptNFT
  console.log('\n[3/4] Deploying InvoiceReceiptNFT...');
  const nftArgs = encodeAbiParameters(
    [{ type: 'address' }],
    [factorFiAddress]
  );
  const nftDeployData = `0x${nftContract.evm.bytecode.object}` + nftArgs.slice(2);
  const nftHash = await walletClient.deployContract({
    abi: nftContract.abi,
    bytecode: nftDeployData,
    args: [],
  });
  console.log('InvoiceReceiptNFT Tx:', nftHash);
  const nftReceipt = await publicClient.waitForTransactionReceipt({ hash: nftHash });
  const nftAddress = nftReceipt.contractAddress;
  console.log('🎉 InvoiceReceiptNFT deployed at:', nftAddress);

  // 4. Deploy FactorFiMarketplace
  console.log('\n[4/4] Deploying FactorFiMarketplace...');
  const marketplaceArgs = encodeAbiParameters(
    [{ type: 'address' }, { type: 'address' }],
    [factorFiAddress, nftAddress]
  );
  const marketplaceDeployData = `0x${marketplaceContract.evm.bytecode.object}` + marketplaceArgs.slice(2);
  const marketplaceHash = await walletClient.deployContract({
    abi: marketplaceContract.abi,
    bytecode: marketplaceDeployData,
    args: [],
  });
  console.log('FactorFiMarketplace Tx:', marketplaceHash);
  const marketplaceReceipt = await publicClient.waitForTransactionReceipt({ hash: marketplaceHash });
  const marketplaceAddress = marketplaceReceipt.contractAddress;
  console.log('🎉 FactorFiMarketplace deployed at:', marketplaceAddress);

  // 5. Link InvoiceReceiptNFT to FactorFi Contract (setReceiptNFT)
  console.log('\n[5/5] Linking InvoiceReceiptNFT to FactorFi contract...');
  const linkHash = await walletClient.writeContract({
    address: factorFiAddress,
    abi: factorFiContract.abi,
    functionName: 'setReceiptNFT',
    args: [nftAddress],
  });
  console.log('Linking Tx:', linkHash);
  await publicClient.waitForTransactionReceipt({ hash: linkHash });
  console.log('🎉 InvoiceReceiptNFT successfully linked to FactorFi!');

  console.log('\n✅ Deployment Suite Completed Successfully!');
  console.log('-----------------------------------------------------------');
  console.log('FactorFi Address:            ', factorFiAddress);
  console.log('AutoFactorVault Address:     ', vaultAddress);
  console.log('InvoiceReceiptNFT Address:   ', nftAddress);
  console.log('FactorFiMarketplace Address: ', marketplaceAddress);
  console.log('-----------------------------------------------------------');

  // 6. Update lib/contracts.ts
  console.log('\nUpdating lib/contracts.ts...');
  const contractsTsPath = path.join(__dirname, '..', 'lib', 'contracts.ts');
  let contractsTs = fs.readFileSync(contractsTsPath, 'utf8');

  // Replace address declarations in lib/contracts.ts
  contractsTs = contractsTs.replace(
    /export const FACTORFI_CONTRACT_ADDRESS = '[^']+' as const;/g,
    `export const FACTORFI_CONTRACT_ADDRESS = '${factorFiAddress}' as const;`
  );
  contractsTs = contractsTs.replace(
    /export const AUTO_FACTOR_VAULT_ADDRESS = '[^']+' as const;/g,
    `export const AUTO_FACTOR_VAULT_ADDRESS = '${vaultAddress}' as const;`
  );
  contractsTs = contractsTs.replace(
    /export const INVOICE_RECEIPT_NFT_ADDRESS = '[^']+' as const;/g,
    `export const INVOICE_RECEIPT_NFT_ADDRESS = '${nftAddress}' as const;`
  );
  contractsTs = contractsTs.replace(
    /export const FACTORFI_MARKETPLACE_ADDRESS = '[^']+' as const;/g,
    `export const FACTORFI_MARKETPLACE_ADDRESS = '${marketplaceAddress}' as const;`
  );

  fs.writeFileSync(contractsTsPath, contractsTs, 'utf8');
  console.log('✓ lib/contracts.ts successfully updated!');

  // 7. Update .env file
  console.log('\nUpdating .env file...');
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Remove existing addresses from .env if present
  envContent = envContent
    .split('\n')
    .filter(line => 
      !line.startsWith('FACTORFI_ADDRESS=') && 
      !line.startsWith('AUTO_FACTOR_VAULT_ADDRESS=') && 
      !line.startsWith('INVOICE_RECEIPT_NFT_ADDRESS=') && 
      !line.startsWith('FACTORFI_MARKETPLACE_ADDRESS=')
    )
    .join('\n');

  // Append new addresses
  envContent = envContent.trim() + '\n';
  envContent += `FACTORFI_ADDRESS=${factorFiAddress}\n`;
  envContent += `AUTO_FACTOR_VAULT_ADDRESS=${vaultAddress}\n`;
  envContent += `INVOICE_RECEIPT_NFT_ADDRESS=${nftAddress}\n`;
  envContent += `FACTORFI_MARKETPLACE_ADDRESS=${marketplaceAddress}\n`;

  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('✓ .env file successfully updated!');
}

main().catch(console.error);
