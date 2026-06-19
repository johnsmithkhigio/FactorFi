// FactorFi Contract ABI + Addresses
// Arc Testnet — Chain ID: 5042002

export const USDC_ADDRESS_ARC = '0x3600000000000000000000000000000000000000' as const;
export const EURC_ADDRESS_ARC = '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a' as const;

// Deployed on Arc Testnet — Tx: 0x89a70c6b0532983faa77cd536d514ff6e7f8e02fa9ada85f0d41dc57c37a93aa
export const FACTORFI_CONTRACT_ADDRESS = '0xf3aceefa36e2c8a501eaef9b44df8859159800ed' as const;
export const AUTO_FACTOR_VAULT_ADDRESS = '0x4d6b491c0407b8bd9f4f2128034ec2285bfb3e63' as const;
export const INVOICE_RECEIPT_NFT_ADDRESS = '0xf0c354e9ead55ed1878b03300e3861b56c6c1301' as const;
export const FACTORFI_MARKETPLACE_ADDRESS = '0xc8af8a35d41748115d507ff3fdb3f8a0d3a970b9' as const;

export const USDC_DECIMALS = 6;

export const usdcAbi = [
  {
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'recipient', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const factorFiAbi = [
  // ========== ANCHOR ==========
  {
    inputs: [{ name: '_name', type: 'string' }, { name: '_creditRating', type: 'uint256' }],
    name: 'registerAnchor',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: '_invoiceId', type: 'uint256' }],
    name: 'approveInvoice',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: '_invoiceId', type: 'uint256' }],
    name: 'settleInvoice',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },

  // ========== SUPPLIER ==========
  {
    inputs: [
      { name: '_anchor', type: 'address' },
      { name: '_amount', type: 'uint256' },
      { name: '_dueDate', type: 'uint256' },
      { name: '_description', type: 'string' },
      { name: '_invoiceHash', type: 'bytes32' },
      { name: '_signature', type: 'bytes' },
      { name: '_token', type: 'address' },
    ],
    name: 'submitInvoice',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: '_supplier', type: 'address' },
      { name: '_anchor', type: 'address' },
      { name: '_amount', type: 'uint256' },
      { name: '_dueDate', type: 'uint256' },
      { name: '_description', type: 'string' },
      { name: '_invoiceHash', type: 'bytes32' },
      { name: '_signature', type: 'bytes' },
      { name: '_token', type: 'address' },
    ],
    name: 'submitInvoiceOnBehalf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },

  // ========== INVESTOR ==========
  {
    inputs: [{ name: '_invoiceId', type: 'uint256' }, { name: '_discountBps', type: 'uint256' }],
    name: 'fundInvoice',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: '_invoiceId', type: 'uint256' }],
    name: 'tokenizeInvoice',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'uint256' }],
    name: 'isTokenized',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'receiptNFT',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },

  // ========== VIEWS ==========
  {
    inputs: [{ name: '_invoiceId', type: 'uint256' }],
    name: 'getInvoice',
    outputs: [{
      name: '',
      type: 'tuple',
      components: [
        { name: 'id', type: 'uint256' },
        { name: 'supplier', type: 'address' },
        { name: 'anchor', type: 'address' },
        { name: 'investor', type: 'address' },
        { name: 'token', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'fundedAmount', type: 'uint256' },
        { name: 'discountBps', type: 'uint256' },
        { name: 'dueDate', type: 'uint256' },
        { name: 'createdAt', type: 'uint256' },
        { name: 'fundedAt', type: 'uint256' },
        { name: 'settledAt', type: 'uint256' },
        { name: 'description', type: 'string' },
        { name: 'status', type: 'uint8' },
      ],
    }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '_entity', type: 'address' }],
    name: 'getCreditProfile',
    outputs: [{
      name: '',
      type: 'tuple',
      components: [
        { name: 'invoicesSettled', type: 'uint256' },
        { name: 'invoicesDefaulted', type: 'uint256' },
        { name: 'totalVolume', type: 'uint256' },
        { name: 'avgSettlementTime', type: 'uint256' },
        { name: 'onTimeRateBps', type: 'uint256' },
        { name: 'totalAmountFactored', type: 'uint256' },
        { name: 'totalAmountSettled', type: 'uint256' },
        { name: 'weightedAvgSettlementDays', type: 'uint256' },
        { name: 'highestSingleInvoiceValue', type: 'uint256' },
      ],
    }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '_addr', type: 'address' }],
    name: 'getAnchor',
    outputs: [{
      name: '',
      type: 'tuple',
      components: [
        { name: 'name', type: 'string' },
        { name: 'creditRating', type: 'uint256' },
        { name: 'totalApproved', type: 'uint256' },
        { name: 'totalSettled', type: 'uint256' },
        { name: 'isRegistered', type: 'bool' },
      ],
    }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getProtocolStats',
    outputs: [
      { name: '_totalFactored', type: 'uint256' },
      { name: '_totalSettled', type: 'uint256' },
      { name: '_totalInvoices', type: 'uint256' },
      { name: '_protocolFeeBps', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'nextInvoiceId',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalFactoredVolume',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSettledVolume',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },

  {
    inputs: [
      { name: '_treasuryShareBps', type: 'uint256' },
      { name: '_underwriterShareBps', type: 'uint256' },
      { name: '_reservePoolShareBps', type: 'uint256' }
    ],
    name: 'setRevenueSplit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: '_treasuryAddress', type: 'address' },
      { name: '_underwriterAddress', type: 'address' },
      { name: '_reserveAddress', type: 'address' }
    ],
    name: 'setRevenueAddresses',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'treasuryShareBps',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'underwriterShareBps',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'reservePoolShareBps',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'treasuryAddress',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'underwriterAddress',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'reserveAddress',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'address' }],
    name: 'isCompliant',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: '_user', type: 'address' },
      { name: '_status', type: 'bool' },
      { name: '_timestamp', type: 'uint256' },
      { name: '_signature', type: 'bytes' }
    ],
    name: 'updateComplianceStatusWithSignature',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },

  // ========== EVENTS ==========
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'anchor', type: 'address' },
      { indexed: false, name: 'name', type: 'string' },
      { indexed: false, name: 'creditRating', type: 'uint256' },
    ],
    name: 'AnchorRegistered',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'invoiceId', type: 'uint256' },
      { indexed: true, name: 'supplier', type: 'address' },
      { indexed: true, name: 'anchor', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'dueDate', type: 'uint256' },
      { indexed: false, name: 'description', type: 'string' },
    ],
    name: 'InvoiceSubmitted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'invoiceId', type: 'uint256' },
      { indexed: true, name: 'anchor', type: 'address' },
    ],
    name: 'InvoiceApproved',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'invoiceId', type: 'uint256' },
      { indexed: true, name: 'investor', type: 'address' },
      { indexed: false, name: 'fundedAmount', type: 'uint256' },
      { indexed: false, name: 'discountBps', type: 'uint256' },
    ],
    name: 'InvoiceFunded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'invoiceId', type: 'uint256' },
      { indexed: true, name: 'anchor', type: 'address' },
      { indexed: false, name: 'investorPayout', type: 'uint256' },
      { indexed: false, name: 'protocolFee', type: 'uint256' },
    ],
    name: 'InvoiceSettled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'invoiceId', type: 'uint256' },
      { indexed: false, name: 'totalFeeAmount', type: 'uint256' },
      { indexed: false, name: 'treasuryPayout', type: 'uint256' },
      { indexed: false, name: 'underwriterPayout', type: 'uint256' },
      { indexed: false, name: 'reservePayout', type: 'uint256' },
    ],
    name: 'RevenueDistributed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'entity', type: 'address' },
      { indexed: false, name: 'invoicesSettled', type: 'uint256' },
      { indexed: false, name: 'onTimeRateBps', type: 'uint256' },
    ],
    name: 'CreditProfileUpdated',
    type: 'event',
  },
] as const;

export const autoFactorVaultAbi = [
  {
    inputs: [
      { name: '_asset', type: 'address' },
      { name: '_factorFi', type: 'address' },
      { name: '_name', type: 'string' },
      { name: '_symbol', type: 'string' }
    ],
    stateMutability: 'nonpayable',
    type: 'constructor'
  },
  {
    inputs: [],
    name: 'asset',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'factorFi',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'totalAssets',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'assets', type: 'uint256' }],
    name: 'convertToShares',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'shares', type: 'uint256' }],
    name: 'convertToAssets',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'assets', type: 'uint256' }, { name: 'receiver', type: 'address' }],
    name: 'deposit',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'shares', type: 'uint256' }, { name: 'receiver', type: 'address' }],
    name: 'mint',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'assets', type: 'uint256' },
      { name: 'receiver', type: 'address' },
      { name: 'ownerAddress', type: 'address' }
    ],
    name: 'withdraw',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'shares', type: 'uint256' },
      { name: 'receiver', type: 'address' },
      { name: 'ownerAddress', type: 'address' }
    ],
    name: 'redeem',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'minDiscountBps',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'minCreditScore',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: '_minDiscountBps', type: 'uint256' }, { name: '_minCreditScore', type: 'uint256' }],
    name: 'setMatchingRules',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: '_invoiceId', type: 'uint256' }, { name: '_discountBps', type: 'uint256' }],
    name: 'autoFundInvoice',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: '_invoiceId', type: 'uint256' }],
    name: 'syncSettlement',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'activeAllocations',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const;

export const invoiceReceiptNftAbi = [
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'to', type: 'address' }, { name: 'tokenId', type: 'uint256' }],
    name: 'approve',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'getApproved',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'operator', type: 'address' }, { name: 'approved', type: 'bool' }],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'operator', type: 'address' }
    ],
    name: 'isApprovedForAll',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' }
    ],
    name: 'transferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' }
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const;

export const factorFiMarketplaceAbi = [
  {
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'price', type: 'uint256' }
    ],
    name: 'listInvoice',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'cancelListing',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'buyInvoice',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getActiveListings',
    outputs: [
      {
        components: [
          { name: 'tokenId', type: 'uint256' },
          { name: 'seller', type: 'address' },
          { name: 'price', type: 'uint256' },
          { name: 'active', type: 'bool' }
        ],
        name: '',
        type: 'tuple[]'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: '', type: 'uint256' }],
    name: 'listings',
    outputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'seller', type: 'address' },
      { name: 'price', type: 'uint256' },
      { name: 'active', type: 'bool' }
    ],
    stateMutability: 'view',
    type: 'function'
  }
] as const;
