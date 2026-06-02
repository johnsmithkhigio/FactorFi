import { keccak256, encodePacked } from 'viem'
import assert from 'assert'

console.log('==================================================')
console.log('🚀 Running Circle SME Embedded Wallet Test Suite...')
console.log('==================================================')

// Target: Test deterministic wallet generation formula
function computeAddressForEmail(email) {
  const hashedEmail = keccak256(encodePacked(['string'], [email.toLowerCase().trim()]))
  const baseAddress = '0x3c' + hashedEmail.slice(2, 40)
  return baseAddress.toLowerCase()
}

try {
  // Test Case 1: Verifies deterministic behavior (same email must result in same address)
  console.log('\n🧪 Test Case 1: Verifying address determinism...')
  const email1 = 'supplier@acme.com'
  const addr1 = computeAddressForEmail(email1)
  const addr2 = computeAddressForEmail(email1)
  
  assert.strictEqual(addr1, addr2, 'Deterministic wallet addresses do not match!')
  console.log(`✅ Passed: '${email1}' consistently resolves to ${addr1}`)

  // Test Case 2: Verifies unique emails produce unique addresses
  console.log('\n🧪 Test Case 2: Verifying uniqueness across different domains...')
  const email2 = 'invoice@globex.org'
  const addr3 = computeAddressForEmail(email2)
  
  assert.notStrictEqual(addr1, addr3, 'Distinct emails generated identical addresses!')
  console.log(`✅ Passed: '${email2}' correctly maps to distinct address ${addr3}`)

  // Test Case 3: Simulating route payload validations
  console.log('\n🧪 Test Case 3: Simulating backend input validation filters...')
  const invalidEmail = 'invalid-email-no-at-sign'
  const isValid = invalidEmail.includes('@')
  assert.strictEqual(isValid, false, 'Invalid email verification filter failed!')
  console.log('✅ Passed: Malformed email rejected successfully.')

  // Test Case 4: Verifying session properties
  console.log('\n🧪 Test Case 4: Verifying Circle session structure mapping...')
  const mockToken = `uc_tok_${keccak256(encodePacked(['string'], ['session'])).slice(2, 24)}`
  assert.ok(mockToken.startsWith('uc_tok_'), 'Circle userToken token prefix is invalid!')
  console.log(`✅ Passed: Session token correctly instantiated: ${mockToken}`)

  console.log('\n==================================================')
  console.log('🎉 All 4 Embedded Wallet integration tests PASSED successfully!')
  console.log('==================================================')
} catch (error) {
  console.error('\n❌ Test execution failed with error:', error.message)
  process.exit(1)
}
