export interface NavigationSubItem {
  id: string
  title: string
  description: string
  icon: string // Lucide icon name mapping
  viewId?: 'landing' | 'dashboard' | 'supplier' | 'anchor' | 'investor' | 'bridge' | 'credit' | 'agent'
  externalUrl?: string
  badge?: 'Beta' | 'New' | 'Stable' | 'Deprecated'
}

export interface NavigationCategory {
  id: string
  label: string
  subItems: NavigationSubItem[]
}

export interface Workspace {
  id: string
  name: string
  role: 'Owner' | 'Administrator' | 'Viewer'
  type: 'Production' | 'Sandbox' | 'Development'
  companyName: string
}

export interface Environment {
  id: 'production' | 'sandbox' | 'testnet' | 'development'
  label: string
  color: string // CSS color class/variable
  description: string
}

export const WORKSPACES: Workspace[] = [
  { id: 'ws-1', name: 'Acme Treasury', role: 'Owner', type: 'Production', companyName: 'Acme Corp' },
  { id: 'ws-2', name: 'Acme Sandbox', role: 'Administrator', type: 'Sandbox', companyName: 'Acme Corp' },
  { id: 'ws-3', name: 'Personal Wallet', role: 'Owner', type: 'Development', companyName: 'Personal' }
]

export const ENVIRONMENTS: Environment[] = [
  { id: 'production', label: 'Production', color: 'var(--ff-success)', description: 'Mainnet transactions' },
  { id: 'sandbox', label: 'Sandbox Mode', color: 'var(--ff-primary)', description: 'Mocked relayers & agents' },
  { id: 'testnet', label: 'ARC Testnet L1', color: 'var(--ff-violet)', description: 'Active test network' },
  { id: 'development', label: 'Development', color: 'var(--ff-text-muted)', description: 'Local network tests' }
]

export const NAVIGATION_SCHEMA: NavigationCategory[] = [
  {
    id: 'products',
    label: 'Products',
    subItems: [
      {
        id: 'dashboard',
        title: 'Treasury Dashboard',
        description: 'Real-time assets, invoices, and yield overview',
        icon: 'LayoutDashboard',
        viewId: 'dashboard'
      },
      {
        id: 'supplier',
        title: 'Invoice Factoring',
        description: 'Early invoice financing for suppliers',
        icon: 'FileText',
        viewId: 'supplier'
      },
      {
        id: 'anchor',
        title: 'Buyer Portal',
        description: 'Approve receivables & settle credit accounts',
        icon: 'Building2',
        viewId: 'anchor'
      },
      {
        id: 'investor',
        title: 'Invest Pools',
        description: 'Deposit stablecoins and earn institutional yields',
        icon: 'TrendingUp',
        viewId: 'investor'
      },
      {
        id: 'bridge',
        title: 'Funding Bridge',
        description: 'Cross-chain CCTP instant stablecoin transfers',
        icon: 'ArrowRightLeft',
        viewId: 'bridge'
      }
    ]
  },
  {
    id: 'operations',
    label: 'Operations',
    subItems: [
      {
        id: 'receivables',
        title: 'Invoice Receivables',
        description: 'Track outstanding invoice status & early payouts',
        icon: 'FileText',
        viewId: 'supplier'
      },
      {
        id: 'settlements',
        title: 'Buyer Settlements',
        description: 'Review escrow contracts & buyer lockups',
        icon: 'Building2',
        viewId: 'anchor'
      },
      {
        id: 'transfers',
        title: 'Bridge Transfers',
        description: 'CCTP deposit and mint confirmations log',
        icon: 'ArrowRightLeft',
        viewId: 'bridge'
      }
    ]
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    subItems: [
      {
        id: 'agent',
        title: 'Agent OS',
        description: 'Autonomous AI treasury agent & risk underwriter',
        icon: 'Bot',
        viewId: 'agent',
        badge: 'New'
      },
      {
        id: 'credit',
        title: 'Credit Passports',
        description: 'Decentralized credit ratings & verified history',
        icon: 'Shield',
        viewId: 'credit'
      }
    ]
  },
  {
    id: 'developer',
    label: 'Developer',
    subItems: [
      {
        id: 'faucet',
        title: 'Sandbox Faucet',
        description: 'Request USDC test tokens & gas sponsorship',
        icon: 'Zap'
      },
      {
        id: 'api-docs',
        title: 'API Reference',
        description: 'Access the B2B invoicing API docs',
        icon: 'Terminal',
        externalUrl: '/docs/api'
      },
      {
        id: 'explorer',
        title: 'Block Explorer',
        description: 'Verify transactions on the ARC Explorer',
        icon: 'ExternalLink',
        externalUrl: 'https://explorer.arc.circle.com'
      }
    ]
  },
  {
    id: 'resources',
    label: 'Resources',
    subItems: [
      {
        id: 'docs',
        title: 'Documentation',
        description: 'Integrate and leverage FactorFi vaults',
        icon: 'FileText',
        externalUrl: '/docs'
      },
      {
        id: 'faq',
        title: 'FAQ Support',
        description: 'Answers to common treasury questions',
        icon: 'HelpCircle',
        externalUrl: '/faq'
      }
    ]
  }
]
