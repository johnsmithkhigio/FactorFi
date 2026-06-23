import { expect } from 'chai';
import { GatewayClient } from '../lib/gateway-client.ts';
import pkg from 'hardhat';
const { ethers } = pkg;

describe('Circle Gateway Nanopayments (x402) Integration Tests', function () {
  let user;
  const expectedFee = 0.0001; // $0.0001 USDC

  before(async function () {
    const signers = await ethers.getSigners();
    user = signers[1]; // Use second signer for tests
  });

  beforeEach(function () {
    // Reset/initialize balance for testing
    const addr = user.address.toLowerCase();
    const ledger = {
      balances: {
        [addr]: 0.0500 // Start with 0.05 USDC balance
      },
      transactions: []
    };
    // Directly inject into the local store for sandbox testing
    import('fs').then((fs) => {
      import('path').then((path) => {
        const filePath = path.join(process.cwd(), 'data', 'gateway-ledgers.json');
        fs.writeFileSync(filePath, JSON.stringify(ledger, null, 2));
      });
    });
  });

  describe('Gateway Ledger Balance Management', function () {
    it('Should correctly return current user balance', function () {
      const balance = GatewayClient.getGatewayBalance(user.address);
      expect(balance).to.equal(0.0500);
    });

    it('Should deposit USDC and update balance', async function () {
      const result = await GatewayClient.depositToGateway(user.address, 0.0250, '0xmocktxhash');
      expect(result.success).to.equal(true);
      expect(result.newBalance).to.equal(0.0750);

      const balance = GatewayClient.getGatewayBalance(user.address);
      expect(balance).to.equal(0.0750);
    });

    it('Should record transactions in ledger history', async function () {
      await GatewayClient.depositToGateway(user.address, 0.0100);
      GatewayClient.spendGatewayBalance(user.address, 0.0001, 'Underwriter AI Scan');

      const txs = GatewayClient.getTransactions(user.address);
      expect(txs.length).to.equal(2);
      expect(txs[0].type).to.equal('deposit');
      expect(txs[1].type).to.equal('spend');
      expect(txs[1].amount).to.equal(0.0001);
    });
  });

  describe('x402 Cryptographic Handshake & Proof Verification', function () {
    it('Should verify valid nanopayment proof and spend fee', async function () {
      const timestamp = Date.now();
      const nonce = 'testnonce123';
      const message = `Circle Nanopayment: ${user.address.toLowerCase()} pays ${expectedFee} USDC. Nonce: ${nonce}. Timestamp: ${timestamp}`;

      // Sign message using ethers signer
      const signature = await user.signMessage(message);

      const proof = {
        signature,
        timestamp,
        nonce,
        address: user.address,
        amount: expectedFee.toString()
      };

      const proofString = JSON.stringify(proof);

      // Verify proof
      const result = await GatewayClient.verifyNanopaymentProof(proofString, expectedFee);
      expect(result.valid).to.equal(true);
      expect(result.newBalance).to.equal(0.0499); // 0.05 - 0.0001

      const newBalance = GatewayClient.getGatewayBalance(user.address);
      expect(newBalance).to.equal(0.0499);
    });

    it('Should fail if Gateway balance is insufficient', async function () {
      // Empty balance
      const addr = user.address.toLowerCase();
      import('fs').then((fs) => {
        import('path').then((path) => {
          const filePath = path.join(process.cwd(), 'data', 'gateway-ledgers.json');
          fs.writeFileSync(filePath, JSON.stringify({ balances: { [addr]: 0 }, transactions: [] }));
        });
      });

      const timestamp = Date.now();
      const nonce = 'testnonce456';
      const message = `Circle Nanopayment: ${user.address.toLowerCase()} pays ${expectedFee} USDC. Nonce: ${nonce}. Timestamp: ${timestamp}`;
      const signature = await user.signMessage(message);

      const proof = {
        signature,
        timestamp,
        nonce,
        address: user.address,
        amount: expectedFee.toString()
      };

      const result = await GatewayClient.verifyNanopaymentProof(JSON.stringify(proof), expectedFee);
      expect(result.valid).to.equal(false);
      expect(result.error).to.include('Insufficient Gateway balance');
    });

    it('Should fail if proof contains expired timestamp', async function () {
      const expiredTimestamp = Date.now() - 700000; // > 10 minutes ago
      const nonce = 'expirednonce';
      const message = `Circle Nanopayment: ${user.address.toLowerCase()} pays ${expectedFee} USDC. Nonce: ${nonce}. Timestamp: ${expiredTimestamp}`;
      const signature = await user.signMessage(message);

      const proof = {
        signature,
        timestamp: expiredTimestamp,
        nonce,
        address: user.address,
        amount: expectedFee.toString()
      };

      const result = await GatewayClient.verifyNanopaymentProof(JSON.stringify(proof), expectedFee);
      expect(result.valid).to.equal(false);
      expect(result.error).to.include('expired');
    });

    it('Should fail if proof contains invalid signature', async function () {
      const timestamp = Date.now();
      const nonce = 'badsignature';
      const proof = {
        signature: '0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        timestamp,
        nonce,
        address: user.address,
        amount: expectedFee.toString()
      };

      const result = await GatewayClient.verifyNanopaymentProof(JSON.stringify(proof), expectedFee);
      expect(result.valid).to.equal(false);
    });
  });
});
