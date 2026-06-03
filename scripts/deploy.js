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
  console.log('=== FactorFi & AutoFactorVault Deployment ===\n');

  // 1. Compile both contracts
  const factorFiPath = path.join(__dirname, '..', 'contracts', 'FactorFi.sol');
  const vaultPath = path.join(__dirname, '..', 'contracts', 'AutoFactorVault.sol');
  
  const factorFiSource = fs.readFileSync(factorFiPath, 'utf8');
  const vaultSource = fs.readFileSync(vaultPath, 'utf8');

  const input = {
    language: 'Solidity',
    sources: { 
      'FactorFi.sol': { content: factorFiSource },
      'AutoFactorVault.sol': { content: vaultSource }
    },
    settings: {
      viaIR: true,
      optimizer: { enabled: true, runs: 200 },
      outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } },
    },
  };

  console.log('Compiling contracts with solc...');
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

  console.log('FactorFi compilation complete.');
  console.log('AutoFactorVault compilation complete.');

  // 2. Setup account
  const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}`);
  console.log('Deployer Account:', account.address);

  const publicClient = createPublicClient({ chain: arcTestnet, transport: http() });
  const walletClient = createWalletClient({ account, chain: arcTestnet, transport: http() });

  // Check balance
  const balance = await publicClient.getBalance({ address: account.address });
  console.log('Balance:', (Number(balance) / 1e18).toFixed(6), 'USDC (gas)');

  if (balance === 0n) {
    console.error('\n❌ No balance! Get testnet USDC from https://faucet.circle.com');
    process.exit(1);
  }

  // 3. Deploy FactorFi
  const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';
  const EURC_ADDRESS = '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a';
  const PROTOCOL_FEE_BPS = 50n; // 0.5%

  console.log('\nDeploying FactorFi to Arc Testnet...');
  const { encodeAbiParameters } = await import('viem');
  const factorFiConstructorArgs = encodeAbiParameters(
    [{ type: 'address[]' }, { type: 'uint256' }],
    [[USDC_ADDRESS, EURC_ADDRESS], PROTOCOL_FEE_BPS]
  );

  const factorFiDeployData = `0x${factorFiContract.evm.bytecode.object}` + factorFiConstructorArgs.slice(2);

  const factorFiHash = await walletClient.deployContract({
    abi: factorFiContract.abi,
    bytecode: factorFiDeployData,
    args: [],
  });

  console.log('FactorFi Tx Hash:', factorFiHash);
  console.log('Waiting for confirmation...');
  const factorFiReceipt = await publicClient.waitForTransactionReceipt({ hash: factorFiHash });
  const factorFiAddress = factorFiReceipt.contractAddress;
  console.log('FactorFi Deployed Address:', factorFiAddress);

  // 4. Deploy AutoFactorVault
  console.log('\nDeploying AutoFactorVault to Arc Testnet...');
  const vaultConstructorArgs = encodeAbiParameters(
    [{ type: 'address' }, { type: 'address' }, { type: 'string' }, { type: 'string' }],
    [USDC_ADDRESS, factorFiAddress, 'FactorFi Yield Vault', 'ffUSDC']
  );

  const vaultDeployData = `0x${vaultContract.evm.bytecode.object}` + vaultConstructorArgs.slice(2);

  const vaultHash = await walletClient.deployContract({
    abi: vaultContract.abi,
    bytecode: vaultDeployData,
    args: [],
  });

  console.log('AutoFactorVault Tx Hash:', vaultHash);
  console.log('Waiting for confirmation...');
  const vaultReceipt = await publicClient.waitForTransactionReceipt({ hash: vaultHash });
  const vaultAddress = vaultReceipt.contractAddress;
  console.log('AutoFactorVault Deployed Address:', vaultAddress);

  console.log('\n✅ Deployment Completed Successfully!');
  console.log('-----------------------------------------------------------');
  console.log('FactorFi Address:', factorFiAddress);
  console.log('AutoFactorVault Address:', vaultAddress);
  console.log('-----------------------------------------------------------');
  console.log('\n📝 Update lib/contracts.ts with following values:');
  console.log(`export const FACTORFI_CONTRACT_ADDRESS = '${factorFiAddress}' as const;`);
  console.log(`export const AUTO_FACTOR_VAULT_ADDRESS = '${vaultAddress}' as const;`);
}

main().catch(console.error);
