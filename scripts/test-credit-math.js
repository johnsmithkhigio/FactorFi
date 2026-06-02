import assert from 'assert'

console.log('===========================================================')
console.log('📊 Running On-Chain Credit Profiling Math Test Suite...')
console.log('===========================================================')

// Simulates the Solidity contract math for _updateCreditProfile
function simulateSolidityCreditProfileUpdate(profile, amount, settlementTimeSeconds) {
  const previousAmountSettled = profile.totalAmountSettled
  profile.totalAmountFactored += amount
  profile.totalVolume += 1
  profile.invoicesSettled += 1
  profile.totalAmountSettled += amount

  if (amount > profile.highestSingleInvoiceValue) {
    profile.highestSingleInvoiceValue = amount
  }

  const settlementDays = Math.floor(settlementTimeSeconds / 86400) || 1

  if (previousAmountSettled === 0) {
    profile.weightedAvgSettlementDays = settlementDays
  } else {
    // Solidity: profile.weightedAvgSettlementDays = ((profile.weightedAvgSettlementDays * previousAmountSettled) + (settlementDays * _amount)) / profile.totalAmountSettled
    profile.weightedAvgSettlementDays = Math.floor(
      ((profile.weightedAvgSettlementDays * previousAmountSettled) + (settlementDays * amount)) / profile.totalAmountSettled
    )
  }

  return profile
}

try {
  // Test Case 1: Initial Settlement
  console.log('\n🧪 Test Case 1: Simulating initial settlement delay (10 days, 10,000 USDC)...')
  let profile = {
    invoicesSettled: 0,
    totalVolume: 0,
    totalAmountFactored: 0,
    totalAmountSettled: 0,
    weightedAvgSettlementDays: 0,
    highestSingleInvoiceValue: 0
  }

  profile = simulateSolidityCreditProfileUpdate(profile, 10000, 10 * 86400)
  
  assert.strictEqual(profile.weightedAvgSettlementDays, 10, 'Weighted average days does not match!')
  assert.strictEqual(profile.highestSingleInvoiceValue, 10000, 'Highest invoice value does not match!')
  console.log(`✅ Passed: Weighted days = ${profile.weightedAvgSettlementDays}, Highest invoice = ${profile.highestSingleInvoiceValue}`)

  // Test Case 2: Subsequent Settlement (Smaller invoice, longer delay)
  console.log('\n🧪 Test Case 2: Settling subsequent invoice (20 days, 5,000 USDC)...')
  profile = simulateSolidityCreditProfileUpdate(profile, 5000, 20 * 86400)
  
  // Total settled: 15,000 USDC
  // Expected weighted: ((10 * 10000) + (20 * 5000)) / 15000 = (100000 + 100000) / 15000 = 200000 / 15000 = 13.33 -> 13
  assert.strictEqual(profile.weightedAvgSettlementDays, 13, 'Weighted average days calculation is incorrect!')
  console.log(`✅ Passed: Rolling weighted days correctly rounded down to ${profile.weightedAvgSettlementDays}`)

  // Test Case 3: Large Ticket Settlement (Huge invoice, very short delay)
  console.log('\n🧪 Test Case 3: Settling large ticket invoice (2 days, 85,000 USDC)...')
  profile = simulateSolidityCreditProfileUpdate(profile, 85000, 2 * 86400)
  
  // Previous settled: 15,000 USDC at weighted avg 13 days
  // New invoice: 85,000 USDC at 2 days
  // Total settled: 100,000 USDC
  // Expected weighted: ((13 * 15000) + (2 * 85000)) / 100000 = (195000 + 170000) / 100000 = 365000 / 100000 = 3.65 -> 3
  assert.strictEqual(profile.weightedAvgSettlementDays, 3, 'Weighted average days failed to scale with face value!')
  assert.strictEqual(profile.highestSingleInvoiceValue, 85000, 'Failed to update peak highest single invoice capacity!')
  console.log(`✅ Passed: High volume invoice pulled average down to ${profile.weightedAvgSettlementDays} days, peak capacity = ${profile.highestSingleInvoiceValue}`)

  console.log('\n===========================================================')
  console.log('🎉 All credit profiling math validation checks PASSED successfully!')
  console.log('===========================================================')
} catch (error) {
  console.error('\n❌ Mathematical simulation failed:', error.message)
  process.exit(1)
}
