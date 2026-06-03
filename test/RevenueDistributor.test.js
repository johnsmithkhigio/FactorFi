import pkg from 'hardhat';
const { ethers } = pkg;
import { expect } from 'chai';

describe('FactorFi Protocol Revenue Engine & Fee Splitting Tests', function () {
  let factorFi;
  let usdcMock;
  let owner;
  let supplier;
  let anchor;
  let investor;
  let underwriterAgent;
  let treasuryAddr;
  let underwriterAddr;
  let reserveAddr;

  beforeEach(async function () {
    [
      owner,
      supplier,
      anchor,
      investor,
      underwriterAgent,
      treasuryAddr,
      underwriterAddr,
      reserveAddr
    ] = await ethers.getSigners();

    // 1. Deploy ERC20Mock
    const ERC20MockFactory = await ethers.getContractFactory('ERC20Mock');
    usdcMock = await ERC20MockFactory.deploy();
    await usdcMock.waitForDeployment();

    // 2. Deploy FactorFi with Supported Tokens array and 1.0% protocol fee (100 BPS)
    const FactorFiFactory = await ethers.getContractFactory('FactorFi');
    factorFi = await FactorFiFactory.deploy([await usdcMock.getAddress()], 100n);
    await factorFi.waitForDeployment();

    // Set underwriter agent
    await factorFi.setUnderwriterAgent(underwriterAgent.address);

    // Whitelist test addresses for compliance
    await factorFi.updateComplianceStatus(owner.address, true);
    await factorFi.updateComplianceStatus(supplier.address, true);
    await factorFi.updateComplianceStatus(anchor.address, true);
    await factorFi.updateComplianceStatus(investor.address, true);
    await factorFi.updateComplianceStatus(underwriterAgent.address, true);

    // Register anchor
    await factorFi.connect(anchor).registerAnchor('Acme Corp', 950n);

    // Setup addresses and splits: 50% Treasury, 30% Underwriter, 20% Reserve
    await factorFi.setRevenueAddresses(
      treasuryAddr.address,
      underwriterAddr.address,
      reserveAddr.address
    );
    await factorFi.setRevenueSplit(5000n, 3000n, 2000n);

    // Mint USDC tokens for anchor and investor
    const initialBalance = ethers.parseUnits('100000', 6);
    await usdcMock.mint(anchor.address, initialBalance);
    await usdcMock.mint(investor.address, initialBalance);

    // Approve allowances
    await usdcMock.connect(anchor).approve(await factorFi.getAddress(), ethers.MaxUint256);
    await usdcMock.connect(investor).approve(await factorFi.getAddress(), ethers.MaxUint256);
  });

  it('Should correctly configure initial revenue splitting configurations', async function () {
    expect(await factorFi.treasuryShareBps()).to.equal(5000n);
    expect(await factorFi.underwriterShareBps()).to.equal(3000n);
    expect(await factorFi.reservePoolShareBps()).to.equal(2000n);

    expect(await factorFi.treasuryAddress()).to.equal(treasuryAddr.address);
    expect(await factorFi.underwriterAddress()).to.equal(underwriterAddr.address);
    expect(await factorFi.reserveAddress()).to.equal(reserveAddr.address);
  });

  it('Should allow owner to modify split percentages and target payout addresses', async function () {
    await factorFi.setRevenueSplit(4000n, 4000n, 2000n);
    expect(await factorFi.treasuryShareBps()).to.equal(4000n);
    expect(await factorFi.underwriterShareBps()).to.equal(4000n);

    await factorFi.setRevenueAddresses(owner.address, supplier.address, investor.address);
    expect(await factorFi.treasuryAddress()).to.equal(owner.address);
    expect(await factorFi.underwriterAddress()).to.equal(supplier.address);
  });

  it('Should revert if split percentages do not sum strictly to 10000 (100%)', async function () {
    // Splits summing to 9999
    await expect(
      factorFi.setRevenueSplit(5000n, 3000n, 1999n)
    ).to.be.revertedWith('Share splits sum must equal 10000 BPS (100.00%)');

    // Splits summing to 10001
    await expect(
      factorFi.setRevenueSplit(5000n, 3000n, 2001n)
    ).to.be.revertedWith('Share splits sum must equal 10000 BPS (100.00%)');
  });

  it('Should revert if non-owner attempts to configure splits or target addresses', async function () {
    await expect(
      factorFi.connect(supplier).setRevenueSplit(5000n, 3000n, 2000n)
    ).to.be.revertedWith('Not owner');

    await expect(
      factorFi.connect(supplier).setRevenueAddresses(
        treasuryAddr.address,
        underwriterAddr.address,
        reserveAddr.address
      )
    ).to.be.revertedWith('Not owner');
  });

  it('Should calculate and distribute splits instantly within settleInvoice call', async function () {
    const amount = ethers.parseUnits('10000', 6); // 10,000 USDC face value
    const dueDate = BigInt(Math.floor(Date.now() / 1000) + 30 * 86400);
    const description = 'Invoice #999';

    // 1. Submit Invoice
    const descHash = ethers.keccak256(ethers.toUtf8Bytes(description));
    const invoiceHash = ethers.solidityPackedKeccak256(
      ['address', 'uint256', 'uint256', 'bytes32', 'address'],
      [anchor.address, amount, dueDate, descHash, await usdcMock.getAddress()]
    );

    const messageHashBytes = ethers.getBytes(invoiceHash);
    const signature = await underwriterAgent.signMessage(messageHashBytes);

    await factorFi
      .connect(supplier)
      .submitInvoice(anchor.address, amount, dueDate, description, invoiceHash, signature, await usdcMock.getAddress());

    // 2. Approve Invoice
    const invoiceId = 0n;
    await factorFi.connect(anchor).approveInvoice(invoiceId);

    // 3. Fund Invoice (2.0% discount = 200 BPS)
    await factorFi.connect(investor).fundInvoice(invoiceId, 200n);

    // 4. Record balances before settlement
    const treasuryBalBefore = await usdcMock.balanceOf(treasuryAddr.address);
    const underwriterBalBefore = await usdcMock.balanceOf(underwriterAddr.address);
    const reserveBalBefore = await usdcMock.balanceOf(reserveAddr.address);
    const investorBalBefore = await usdcMock.balanceOf(investor.address);

    // 5. Settle Invoice (Anchor pays face value = 10,000 USDC)
    // Protocol Fee = 10,000 USDC * 1.0% = 100 USDC (60,000,000 micro-USDC)
    // Splits: Treasury (50%) = 50 USDC, Underwriter (30%) = 30 USDC, Reserve (20%) = 20 USDC
    // Investor payout = 10,000 USDC - 100 USDC = 9,900 USDC
    await expect(factorFi.connect(anchor).settleInvoice(invoiceId))
      .to.emit(factorFi, 'InvoiceSettled')
      .to.emit(factorFi, 'RevenueDistributed');

    // 6. Verify correct payouts
    const expectedFeeTotal = ethers.parseUnits('100', 6);
    const expectedTreasuryPayout = ethers.parseUnits('50', 6);
    const expectedUnderwriterPayout = ethers.parseUnits('30', 6);
    const expectedReservePayout = ethers.parseUnits('20', 6);
    const expectedInvestorPayout = ethers.parseUnits('9900', 6);

    expect(await usdcMock.balanceOf(treasuryAddr.address)).to.equal(treasuryBalBefore + expectedTreasuryPayout);
    expect(await usdcMock.balanceOf(underwriterAddr.address)).to.equal(underwriterBalBefore + expectedUnderwriterPayout);
    expect(await usdcMock.balanceOf(reserveAddr.address)).to.equal(reserveBalBefore + expectedReservePayout);
    expect(await usdcMock.balanceOf(investor.address)).to.equal(investorBalBefore + expectedInvestorPayout);
  });
});
