import assert from 'assert'

console.log('===========================================================')
console.log('📈 Running AutoFactorVault ERC-4626 Math & Matching Test...')
console.log('===========================================================')

// Simulation of ERC-4626 Math
class MockAutoFactorVault {
  constructor() {
    this.totalSupply = 0n
    this.balanceOf = {}
    this.activeAllocations = 0n
    this.usdcBalance = 0n
    this.minDiscountBps = 250n
    this.minCreditScore = 900n
  }

  totalAssets() {
    return this.usdcBalance + this.activeAllocations
  }

  convertToShares(assets) {
    const supply = this.totalSupply
    return supply === 0n ? assets : (assets * supply) / this.totalAssets()
  }

  convertToAssets(shares) {
    const supply = this.totalSupply
    return supply === 0n ? shares : (shares * this.totalAssets()) / supply
  }

  deposit(assets, receiver) {
    const shares = this.convertToShares(assets)
    this.usdcBalance += assets
    this.totalSupply += shares
    this.balanceOf[receiver] = (this.balanceOf[receiver] || 0n) + shares
    return shares
  }

  withdraw(assets, receiver, owner) {
    const shares = this.convertToShares(assets)
    
    // Safety check: local USDC reserves must be able to support the withdrawal amount
    if (this.usdcBalance < assets) {
      throw new Error('Insufficient local liquidity (active allocations locked)')
    }

    this.usdcBalance -= assets
    this.totalSupply -= shares
    this.balanceOf[owner] -= shares
    return shares
  }

  autoFundInvoice(invoiceAmount, discountBps, anchorScore) {
    if (discountBps < this.minDiscountBps) {
      throw new Error('Discount below minimum')
    }
    if (anchorScore < this.minCreditScore) {
      throw new Error('Anchor rating below minimum')
    }

    const discountedAmount = invoiceAmount - (invoiceAmount * discountBps / 10000n)
    
    if (this.usdcBalance < discountedAmount) {
      throw new Error('Insufficient vault liquidity')
    }

    this.usdcBalance -= discountedAmount
    this.activeAllocations += discountedAmount
    return discountedAmount
  }

  settleInvoice(invoiceAmount, profitEarned) {
    // Settle invoice back to vault
    this.activeAllocations -= (invoiceAmount - profitEarned)
    this.usdcBalance += invoiceAmount // Vault gets paid face value back (earns profitEarned yield!)
  }
}

try {
  const vault = new MockAutoFactorVault()

  // Test Case 1: Initial Deposit
  console.log('\n🧪 Test Case 1: Simulating initial deposit of 10,000 USDC...')
  const shares1 = vault.deposit(10000n * 1000000n, 'alice')
  assert.strictEqual(shares1, 10000n * 1000000n, 'First depositor share math should be 1:1')
  assert.strictEqual(vault.totalAssets(), 10000n * 1000000n, 'Total assets incorrect')
  console.log('✅ Passed: Shares minted 1:1 on initial deposit.')

  // Test Case 2: Matching Invoice Funding Outflow
  console.log('\n🧪 Test Case 2: Deploying vault capital into qualified invoice...')
  // Invoice face value: 5,000 USDC, discount: 3.0%, rating: 950
  const outflow = vault.autoFundInvoice(5000n * 1000000n, 300n, 950n)
  
  // 5000 - (5000 * 3%) = 4850 USDC funded
  assert.strictEqual(outflow, 4850n * 1000000n, 'Outflow calculation incorrect')
  assert.strictEqual(vault.totalAssets(), 10000n * 1000000n, 'TVL should remain constant during deployment')
  assert.strictEqual(vault.usdcBalance, 5150n * 1000000n, 'Idle reserve did not decrease correctly')
  assert.strictEqual(vault.activeAllocations, 4850n * 1000000n, 'Active allocations did not increase correctly')
  console.log('✅ Passed: Capital successfully deployed on-chain without altering aggregate TVL.')

  // Test Case 3: Withdrawal lock check during active allocation periods
  console.log('\n🧪 Test Case 3: Testing withdraw limits against idle reserves...')
  try {
    vault.withdraw(8000n * 1000000n, 'alice', 'alice')
    assert.fail('Should not be able to withdraw locked assets!')
  } catch (e) {
    assert.strictEqual(e.message, 'Insufficient local liquidity (active allocations locked)', 'Incorrect error message')
    console.log('✅ Passed: Withdrawal locked correctly for active allocations (reserves protection).')
  }

  // Test Case 4: Yield matching profit receipt on invoice settlement
  console.log('\n🧪 Test Case 4: Simulating invoice settlement and profit receipt...')
  vault.settleInvoice(5000n * 1000000n, 150n * 1000000n)
  
  // Vault got 5000 USDC back, active allocations cleared.
  // New TVL = 5150 (idle) + 5000 (returned) = 10150 USDC (150 USDC profit!)
  assert.strictEqual(vault.totalAssets(), 10150n * 1000000n, 'Vault yield did not compound TVL')
  assert.strictEqual(vault.activeAllocations, 0n, 'Active allocations should be cleared')
  console.log('✅ Passed: Compounded TVL compound matches face value settlement yield.')

  // Test Case 5: Secondary Depositor Share Math (Premium Shares)
  console.log('\n🧪 Test Case 5: Simulating premium depositor share calculations...')
  // Bob deposits 5,000 USDC
  // Converter = (5000 * 10000) / 10150 = 4926 shares
  const bobShares = vault.deposit(5000n * 1000000n, 'bob')
  assert.strictEqual(bobShares, 4926108374n, 'Bob premium share calculations incorrect')
  console.log(`✅ Passed: Bob minted shares at premium price: ${(Number(bobShares) / 1e6).toFixed(2)} ffUSDC`)

  console.log('\n===========================================================')
  console.log('🎉 All AutoFactorVault unit test checks PASSED successfully!')
  console.log('===========================================================')
} catch (error) {
  console.error('\n❌ Unit test verification failed:', error.message)
  process.exit(1)
}
