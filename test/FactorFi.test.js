import pkg from 'hardhat';
const { ethers } = pkg;
import { expect } from 'chai';

describe('FactorFi Double Factoring & AI Underwriter Signature Tests', function () {
  let factorFi;
  let owner;
  let supplier;
  let anchor;
  let underwriter;
  let usdcMock;

  beforeEach(async function () {
    [owner, supplier, anchor, underwriter] = await ethers.getSigners();

    // Deploy ERC20Mock
    const ERC20MockFactory = await ethers.getContractFactory('ERC20Mock');
    usdcMock = await ERC20MockFactory.deploy();
    await usdcMock.waitForDeployment();

    // Deploy FactorFi with the supported tokens array and 0.5% protocol fee
    const FactorFiFactory = await ethers.getContractFactory('FactorFi');
    factorFi = await FactorFiFactory.deploy([await usdcMock.getAddress()], 50n);
    await factorFi.waitForDeployment();

    // Set the underwriter agent address
    await factorFi.setUnderwriterAgent(underwriter.address);

    // Register anchor
    await factorFi.connect(anchor).registerAnchor('Acme Corp', 950n);
  });

  it('Should successfully submit invoice with valid underwriter signature', async function () {
    const amount = ethers.parseUnits('10000', 6); // 10,000 USDC
    const dueDate = BigInt(Math.floor(Date.now() / 1000) + 30 * 86400); // 30 days future
    const description = 'Invoice #123';

    // Calculate invoice hash
    const descHash = ethers.keccak256(ethers.toUtf8Bytes(description));
    const invoiceHash = ethers.solidityPackedKeccak256(
      ['address', 'uint256', 'uint256', 'bytes32', 'address'],
      [anchor.address, amount, dueDate, descHash, await usdcMock.getAddress()]
    );

    // Sign the hash with the underwriter private key
    const messageHashBytes = ethers.getBytes(invoiceHash);
    const signature = await underwriter.signMessage(messageHashBytes);

    // Submit invoice
    await expect(
      factorFi
        .connect(supplier)
        .submitInvoice(anchor.address, amount, dueDate, description, invoiceHash, signature, await usdcMock.getAddress())
    ).to.emit(factorFi, 'InvoiceSubmitted');

    // Verify it was registered in on-chain double-factoring map
    expect(await factorFi.invoiceHashes(invoiceHash)).to.equal(true);
  });

  it('Should revert if submitting duplicate invoice hash (prevent double-factoring)', async function () {
    const amount = ethers.parseUnits('15000', 6);
    const dueDate = BigInt(Math.floor(Date.now() / 1000) + 45 * 86400);
    const description = 'Invoice #456';

    const descHash = ethers.keccak256(ethers.toUtf8Bytes(description));
    const invoiceHash = ethers.solidityPackedKeccak256(
      ['address', 'uint256', 'uint256', 'bytes32', 'address'],
      [anchor.address, amount, dueDate, descHash, await usdcMock.getAddress()]
    );

    const messageHashBytes = ethers.getBytes(invoiceHash);
    const signature = await underwriter.signMessage(messageHashBytes);

    // Submit first time - success
    await factorFi
      .connect(supplier)
      .submitInvoice(anchor.address, amount, dueDate, description, invoiceHash, signature, await usdcMock.getAddress());

    // Submit second time with same hash - should revert
    await expect(
      factorFi
        .connect(supplier)
        .submitInvoice(anchor.address, amount, dueDate, description, invoiceHash, signature, await usdcMock.getAddress())
    ).to.be.revertedWith('Invoice already factored on-chain');
  });

  it('Should revert if signature is not signed by authorized underwriter agent', async function () {
    const amount = ethers.parseUnits('20000', 6);
    const dueDate = BigInt(Math.floor(Date.now() / 1000) + 60 * 86400);
    const description = 'Invoice #789';

    const descHash = ethers.keccak256(ethers.toUtf8Bytes(description));
    const invoiceHash = ethers.solidityPackedKeccak256(
      ['address', 'uint256', 'uint256', 'bytes32', 'address'],
      [anchor.address, amount, dueDate, descHash, await usdcMock.getAddress()]
    );

    // Sign with owner (unauthorized) instead of underwriter
    const messageHashBytes = ethers.getBytes(invoiceHash);
    const signature = await owner.signMessage(messageHashBytes);

    // Submit - should revert
    await expect(
      factorFi
        .connect(supplier)
        .submitInvoice(anchor.address, amount, dueDate, description, invoiceHash, signature, await usdcMock.getAddress())
    ).to.be.revertedWith('Invalid AI Underwriter signature verification');
  });
});
