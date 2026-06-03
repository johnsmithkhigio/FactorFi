import pkg from 'hardhat';
const { ethers } = pkg;
import { expect } from 'chai';

describe('FactorFi Circle Compliance (KYC/KYB Sanctions Screening) Tests', function () {
  let factorFi;
  let usdcMock;
  let owner;
  let supplier;
  let anchor;
  let investor;
  let nonCompliantUser;

  beforeEach(async function () {
    [owner, supplier, anchor, investor, nonCompliantUser] = await ethers.getSigners();

    // 1. Deploy ERC20Mock
    const ERC20MockFactory = await ethers.getContractFactory('ERC20Mock');
    usdcMock = await ERC20MockFactory.deploy();
    await usdcMock.waitForDeployment();

    // 2. Deploy FactorFi with supported tokens and 0.5% fee
    const FactorFiFactory = await ethers.getContractFactory('FactorFi');
    factorFi = await FactorFiFactory.deploy([await usdcMock.getAddress()], 50n);
    await factorFi.waitForDeployment();
  });

  describe('Administrative Overrides', function () {
    it('Should allow owner to administratively update compliance status', async function () {
      expect(await factorFi.isCompliant(supplier.address)).to.equal(false);

      // Whitelist
      await expect(factorFi.connect(owner).updateComplianceStatus(supplier.address, true))
        .to.emit(factorFi, 'ComplianceStatusUpdated')
        .withArgs(supplier.address, true);

      expect(await factorFi.isCompliant(supplier.address)).to.equal(true);

      // Blacklist/remove
      await expect(factorFi.connect(owner).updateComplianceStatus(supplier.address, false))
        .to.emit(factorFi, 'ComplianceStatusUpdated')
        .withArgs(supplier.address, false);

      expect(await factorFi.isCompliant(supplier.address)).to.equal(false);
    });

    it('Should revert if non-owner tries to update compliance status', async function () {
      await expect(
        factorFi.connect(supplier).updateComplianceStatus(anchor.address, true)
      ).to.be.revertedWith('Not owner');
    });

    it('Should allow owner to change compliance signer', async function () {
      await expect(factorFi.connect(owner).setComplianceSigner(supplier.address))
        .to.emit(factorFi, 'ComplianceSignerUpdated')
        .withArgs(supplier.address);

      expect(await factorFi.complianceSigner()).to.equal(supplier.address);
    });
  });

  describe('Signature Verification (Backend Flow)', function () {
    it('Should successfully verify correct backend signature and update compliance', async function () {
      const timestamp = BigInt(Math.floor(Date.now() / 1000));
      
      // Recreate backend signature generation logic in JS
      const messageHash = ethers.solidityPackedKeccak256(
        ['address', 'bool', 'uint256'],
        [anchor.address, true, timestamp]
      );
      const messageHashBytes = ethers.getBytes(messageHash);
      const signature = await owner.signMessage(messageHashBytes);

      // Submit to chain
      await expect(
        factorFi.connect(anchor).updateComplianceStatusWithSignature(
          anchor.address,
          true,
          timestamp,
          signature
        )
      ).to.emit(factorFi, 'ComplianceStatusUpdated')
       .withArgs(anchor.address, true);

      expect(await factorFi.isCompliant(anchor.address)).to.equal(true);
    });

    it('Should revert if signature is expired', async function () {
      // 25 hours ago
      const expiredTimestamp = BigInt(Math.floor(Date.now() / 1000)) - 90000n;
      
      const messageHash = ethers.solidityPackedKeccak256(
        ['address', 'bool', 'uint256'],
        [anchor.address, true, expiredTimestamp]
      );
      const messageHashBytes = ethers.getBytes(messageHash);
      const signature = await owner.signMessage(messageHashBytes);

      await expect(
        factorFi.connect(anchor).updateComplianceStatusWithSignature(
          anchor.address,
          true,
          expiredTimestamp,
          signature
        )
      ).to.be.revertedWith('Signature expired');
    });

    it('Should revert if signed by unauthorized compliance key', async function () {
      const timestamp = BigInt(Math.floor(Date.now() / 1000));
      
      const messageHash = ethers.solidityPackedKeccak256(
        ['address', 'bool', 'uint256'],
        [anchor.address, true, timestamp]
      );
      const messageHashBytes = ethers.getBytes(messageHash);
      // Signed by supplier instead of owner (complianceSigner)
      const signature = await supplier.signMessage(messageHashBytes);

      await expect(
        factorFi.connect(anchor).updateComplianceStatusWithSignature(
          anchor.address,
          true,
          timestamp,
          signature
        )
      ).to.be.revertedWith('Invalid compliance signature');
    });
  });

  describe('Core Action Access Control (onlyCompliant Modifier)', function () {
    beforeEach(async function () {
      // Setup underwriter
      await factorFi.setUnderwriterAgent(owner.address);
    });

    it('Should prevent non-compliant anchors from registering', async function () {
      await expect(
        factorFi.connect(nonCompliantUser).registerAnchor('Acme Corp', 950n)
      ).to.be.revertedWith('Address is not compliant');
    });

    it('Should prevent non-compliant suppliers from submitting invoices', async function () {
      // Whitelist anchor so supplier can select it
      await factorFi.connect(owner).updateComplianceStatus(anchor.address, true);
      await factorFi.connect(anchor).registerAnchor('Acme Corp', 950n);

      const amount = ethers.parseUnits('5000', 6);
      const dueDate = BigInt(Math.floor(Date.now() / 1000)) + 30n * 86400n;
      const descHash = ethers.keccak256(ethers.toUtf8Bytes('Invoice'));
      
      const invoiceHash = ethers.solidityPackedKeccak256(
        ['address', 'uint256', 'uint256', 'bytes32', 'address'],
        [anchor.address, amount, dueDate, descHash, await usdcMock.getAddress()]
      );
      const signature = await owner.signMessage(ethers.getBytes(invoiceHash));

      await expect(
        factorFi.connect(nonCompliantUser).submitInvoice(
          anchor.address,
          amount,
          dueDate,
          'Invoice',
          invoiceHash,
          signature,
          await usdcMock.getAddress()
        )
      ).to.be.revertedWith('Address is not compliant');
    });

    it('Should prevent non-compliant investors from funding invoices', async function () {
      // Whitelist supplier and anchor
      await factorFi.connect(owner).updateComplianceStatus(supplier.address, true);
      await factorFi.connect(owner).updateComplianceStatus(anchor.address, true);

      await factorFi.connect(anchor).registerAnchor('Acme Corp', 950n);

      const amount = ethers.parseUnits('5000', 6);
      const dueDate = BigInt(Math.floor(Date.now() / 1000)) + 30n * 86400n;
      const descHash = ethers.keccak256(ethers.toUtf8Bytes('Invoice'));
      
      const invoiceHash = ethers.solidityPackedKeccak256(
        ['address', 'uint256', 'uint256', 'bytes32', 'address'],
        [anchor.address, amount, dueDate, descHash, await usdcMock.getAddress()]
      );
      const signature = await owner.signMessage(ethers.getBytes(invoiceHash));

      // Submit invoice
      await factorFi.connect(supplier).submitInvoice(
        anchor.address,
        amount,
        dueDate,
        'Invoice',
        invoiceHash,
        signature,
        await usdcMock.getAddress()
      );

      // Approve invoice
      await factorFi.connect(anchor).approveInvoice(0n);

      // Attempt to fund from non-compliant investor
      await expect(
        factorFi.connect(nonCompliantUser).fundInvoice(0n, 500n)
      ).to.be.revertedWith('Address is not compliant');
    });
  });
});
