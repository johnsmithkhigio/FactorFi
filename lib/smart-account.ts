import { 
  keccak256, 
  encodePacked, 
  getContractAddress, 
  parseEther, 
  encodeFunctionData, 
  Hex,
  createPublicClient,
  http
} from 'viem'
import { arcTestnet } from './arc-config'

export interface UserOperation {
  sender: `0x${string}`
  nonce: bigint
  initCode: `0x${string}`
  callData: `0x${string}`
  callGasLimit: bigint
  verificationGasLimit: bigint
  preVerificationGas: bigint
  maxFeePerGas: bigint
  maxPriorityFeePerGas: bigint
  paymasterAndData: `0x${string}`
  signature: `0x${string}`
}

// Standard simple account factory address on Arc (or generic EVM)
export const SIMPLE_ACCOUNT_FACTORY = '0x940603E4ECB27ECF54C61633dDDeDeFF26262626' as const
export const ENTRY_POINT = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789' as const

/**
 * Computes deterministic simple account address based on EOA owner address
 */
export function getSmartAccountAddress(eoaAddress: `0x${string}`): `0x${string}` {
  // Compute deterministic CREATE2 address representing the user's ERC-4337 Smart Account
  const salt = keccak256(encodePacked(['address'], [eoaAddress]))
  const bytecodeHex = ('0x3d602d80600a3d3981f3363d3d373d3d3d363d73' + eoaAddress.slice(2) + '5af43d82803e903d91602b57fd5bf3') as `0x${string}`
  return getContractAddress({
    from: SIMPLE_ACCOUNT_FACTORY,
    salt: salt,
    bytecode: bytecodeHex,
    opcode: 'CREATE2'
  })
}

/**
 * Prepares UserOperation struct for gasless submissions
 */
export async function prepareUserOperation(
  eoaAddress: `0x${string}`,
  targetContract: `0x${string}`,
  callData: `0x${string}`
): Promise<UserOperation> {
  const sender = getSmartAccountAddress(eoaAddress)
  
  // Connect to Arc Testnet
  const client = createPublicClient({
    chain: arcTestnet,
    transport: http()
  })

  // Get current nonce (simulated or direct from entrypoint if deployed)
  let nonce = BigInt(0)
  try {
    nonce = await client.readContract({
      address: ENTRY_POINT,
      abi: [
        {
          inputs: [
            { name: 'sender', type: 'address' },
            { name: 'key', type: 'uint192' }
          ],
          name: 'getNonce',
          outputs: [{ name: 'nonce', type: 'uint256' }],
          stateMutability: 'view',
          type: 'function'
        }
      ],
      functionName: 'getNonce',
      args: [sender, BigInt(0)]
    }) as bigint
  } catch (e) {
    // Fallback if Entrypoint not queried or address not initialized
    nonce = BigInt(0)
  }

  // Define factory initCode if first transaction
  let initCode = '0x' as Hex
  if (nonce === BigInt(0)) {
    // initCode consists of Factory address + initialize callData
    const initCallData = encodeFunctionData({
      abi: [{
        inputs: [{ name: 'owner', type: 'address' }, { name: 'salt', type: 'uint256' }],
        name: 'createAccount',
        outputs: [{ name: 'ret', type: 'address' }],
        type: 'function'
      }],
      functionName: 'createAccount',
      args: [eoaAddress, BigInt(0)]
    })
    initCode = encodePacked(['address', 'bytes'], [SIMPLE_ACCOUNT_FACTORY, initCallData])
  }

  // Construct execution callData (SimpleAccount standard execute call)
  const execCallData = encodeFunctionData({
    abi: [{
      inputs: [
        { name: 'dest', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'func', type: 'bytes' }
      ],
      name: 'execute',
      outputs: [],
      type: 'function'
    }],
    functionName: 'execute',
    args: [targetContract, BigInt(0), callData]
  })

  return {
    sender,
    nonce,
    initCode,
    callData: execCallData,
    callGasLimit: BigInt(250000),
    verificationGasLimit: BigInt(150000),
    preVerificationGas: BigInt(50000),
    maxFeePerGas: parseEther('0.000001'), // Paid in Arc native USDC gas
    maxPriorityFeePerGas: parseEther('0.0000001'),
    paymasterAndData: '0x',
    signature: '0x'
  }
}
