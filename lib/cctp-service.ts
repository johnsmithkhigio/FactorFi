import { createPublicClient, createWalletClient, http, custom, keccak256, toHex } from 'viem'
import { arcTestnet } from '@/lib/arc-config'

// CCTP Chain Mapping and Circle Contract Addresses (Testnet configurations)
export interface CCTPChainConfig {
  id: string
  name: string
  chainId: number
  domainId: number
  usdcAddress: `0x${string}`
  tokenMessengerAddress: `0x${string}`
  messageTransmitterAddress: `0x${string}`
  explorerUrl: string
}

export const CCTP_CHAINS: Record<string, CCTPChainConfig> = {
  Ethereum_Sepolia: {
    id: 'Ethereum_Sepolia',
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    domainId: 0,
    usdcAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    tokenMessengerAddress: '0x9f3B86791724C357596c56171b3ef0038865668b',
    messageTransmitterAddress: '0xC38260B5B7181512f4625b5aF72e9d2f2dC2FFeB',
    explorerUrl: 'https://sepolia.etherscan.io'
  },
  Base_Sepolia: {
    id: 'Base_Sepolia',
    name: 'Base Sepolia',
    chainId: 84532,
    domainId: 6,
    usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dcf7e',
    tokenMessengerAddress: '0x9F3b86791724C357596c56171B3eF0038865668b',
    messageTransmitterAddress: '0x7865cfb838383838383838383838383838383838', // standard mock address for sandboxes
    explorerUrl: 'https://sepolia.basescan.org'
  },
  Arbitrum_Sepolia: {
    id: 'Arbitrum_Sepolia',
    name: 'Arbitrum Sepolia',
    chainId: 421614,
    domainId: 3,
    usdcAddress: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    tokenMessengerAddress: '0x9F3b86791724C357596c56171B3eF0038865668b',
    messageTransmitterAddress: '0x6e8e8e788b71d9a57be3d8f8d6896c234a582fa1',
    explorerUrl: 'https://sepolia.arbiscan.io'
  },
  Arc_Testnet: {
    id: 'Arc_Testnet',
    name: 'Arc Testnet',
    chainId: 5042002,
    domainId: 26,
    usdcAddress: '0x3600000000000000000000000000000000000000',
    tokenMessengerAddress: '0x470f9ec27d1d8aecf15e57b149d70fd66aa295d6', // FactorFi protocol acts as messenger/receiver
    messageTransmitterAddress: '0x470f9ec27d1d8aecf15e57b149d70fd66aa295d6',
    explorerUrl: 'https://explorer.testnet.arc.network'
  }
}

export interface CachedTransfer {
  id: string
  sourceChain: string
  amount: string
  burnTxHash: string
  messageHash: string
  messageBytes?: string
  attestationSignature?: string
  status: 'burning' | 'attesting' | 'minting' | 'completed' | 'failed'
  timestamp: number
}

const LOCAL_STORAGE_KEY = 'factorfi_cctp_transfers'

export class CCTPBridgeService {
  // 1. Storage Helpers
  public static getCachedTransfers(): CachedTransfer[] {
    if (typeof window === 'undefined') return []
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }

  public static saveTransfer(transfer: CachedTransfer) {
    if (typeof window === 'undefined') return
    try {
      const current = this.getCachedTransfers()
      const index = current.findIndex(t => t.id === transfer.id)
      if (index >= 0) {
        current[index] = transfer
      } else {
        current.push(transfer)
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current))
    } catch (e) {
      console.error('Failed to save CCTP cache to LocalStorage:', e)
    }
  }

  // 2. IRIS Polling Client
  public static async pollIrisAttestation(messageHash: string, onUpdate?: (msg: string) => void): Promise<string> {
    const irisUrl = `https://iris-api-sandbox.circle.com/attestations/${messageHash}`
    onUpdate?.('Polling Circle Iris Attestation sandbox api...')

    for (let attempt = 0; attempt < 30; attempt++) {
      try {
        const res = await fetch(irisUrl)
        if (res.ok) {
          const data = await res.json()
          if (data.status === 'complete' && data.attestation) {
            onUpdate?.('Circle Iris Attestation retrieved successfully!')
            return data.attestation
          }
        }
      } catch (e) {
        console.warn('Iris API lookup attempt failed, retrying...', e)
      }
      await new Promise(r => setTimeout(r, 4000))
      onUpdate?.(`Polling Circle attestation service... (Attempt ${attempt + 1}/30)`)
    }

    throw new Error('Circle CCTP Attestation timeout. Try resuming again later.')
  }
}
