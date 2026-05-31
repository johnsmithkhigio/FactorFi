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
  console.log('=== FactorFi Deployment ===\n');

  // 1. Compile
  const contractPath = path.join(__dirname, '..', 'contracts', 'FactorFi.sol');
  const source = fs.readFileSync(contractPath, 'utf8');

  const input = {
    language: 'Solidity',
    sources: { 'FactorFi.sol': { content: source } },
    settings: {
      viaIR: true,
      optimizer: { enabled: true, runs: 200 },
      outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } },
    },
  };

  console.log('Compiling FactorFi.sol...');
  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    const errors = output.errors.filter(e => e.severity === 'error');
    if (errors.length > 0) {
      console.error('Compilation errors:');
      errors.forEach(e => console.error(e.formattedMessage));
      process.exit(1);
    }
  }

  const contract = output.contracts['FactorFi.sol']['FactorFi'];
  const abi = contract.abi;
  const bytecode = `0x${contract.evm.bytecode.object}`;
  console.log('Compiled successfully. Bytecode length:', bytecode.length);

  // 2. Setup account
  const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}`);
  console.log('Deployer:', account.address);

  const publicClient = createPublicClient({ chain: arcTestnet, transport: http() });
  const walletClient = createWalletClient({ account, chain: arcTestnet, transport: http() });

  // Check balance
  const balance = await publicClient.getBalance({ address: account.address });
  console.log('Balance:', (Number(balance) / 1e18).toFixed(6), 'USDC (gas)');

  if (balance === 0n) {
    console.error('\n❌ No balance! Get testnet USDC from https://faucet.circle.com');
    process.exit(1);
  }

  // 3. Deploy
  const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';
  const PROTOCOL_FEE_BPS = 50n; // 0.5%

  console.log('\nDeploying with:');
  console.log('  USDC:', USDC_ADDRESS);
  console.log('  Fee:', '50 bps (0.5%)');

  // Encode constructor args: (address _usdc, uint256 _protocolFeeBps)
  const { encodeAbiParameters } = await import('viem');
  const constructorArgs = encodeAbiParameters(
    [{ type: 'address' }, { type: 'uint256' }],
    [USDC_ADDRESS, PROTOCOL_FEE_BPS]
  );

  const deployData = bytecode + constructorArgs.slice(2);

  const hash = await walletClient.deployContract({
    abi,
    bytecode: deployData,
    args: [],
  });

  console.log('Tx hash:', hash);
  console.log('Waiting for confirmation...');

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const contractAddress = receipt.contractAddress;

  console.log('\n✅ FactorFi deployed!');
  console.log('Address:', contractAddress);
  console.log('Explorer:', `https://testnet.arcscan.app/address/${contractAddress}`);
  console.log('Tx:', `https://testnet.arcscan.app/tx/${hash}`);
  console.log('\n📝 Update lib/contracts.ts:');
  console.log(`export const FACTORFI_CONTRACT_ADDRESS = '${contractAddress}' as const;`);
}

main().catch(console.error);
