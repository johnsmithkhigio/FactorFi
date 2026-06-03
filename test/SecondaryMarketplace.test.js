import pkg from 'hardhat';
const { ethers } = pkg;
import { expect } from 'chai';

describe('FactorFi Secondary Receivables OTC Marketplace Tests', function () {
  let factorFi;
  let receiptNFT;
  let marketplace;
  let usdcMock;
  let owner;
  let supplier;
  let anchor;
  let underwriter;
  let investor1;
  let investor2;

  beforeEach(async function () {
    [owner, supplier, anchor, underwriter, investor1, investor2] = await ethers.getSigners();

    // 1. Deploy ERC20Mock
    const ERC20MockFactory = await ethers.getContractFactory('ERC20Mock');
    usdcMock = await ERC20MockFactory.deploy();
    await usdcMock.waitForDeployment();

    // 2. Deploy FactorFi with supported tokens and 0.5% protocol fee
    const FactorFiFactory = await ethers.getContractFactory('FactorFi');
    factorFi = await FactorFiFactory.deploy([await usdcMock.getAddress()], 50n);
    await factorFi.waitForDeployment();

    // 3. Deploy InvoiceReceiptNFT
    const NFTFactory = await ethers.getContractFactory('InvoiceReceiptNFT');
    receiptNFT = await NFTFactory.deploy(await factorFi.getAddress());
    await receiptNFT.waitForDeployment();

    // 4. Deploy FactorFiMarketplace
    const MarketplaceFactory = await ethers.getContractFactory('FactorFiMarketplace');
    marketplace = await MarketplaceFactory.deploy(await factorFi.getAddress(), await receiptNFT.getAddress());
    await marketplace.waitForDeployment();

    // 5. Connect NFT contract to FactorFi
    await factorFi.setReceiptNFT(await receiptNFT.getAddress());

    // Set underwriter agent and register anchor
    await factorFi.setUnderwriterAgent(underwriter.address);

    // Whitelist test addresses for compliance
    await factorFi.updateComplianceStatus(owner.address, true);
    await factorFi.updateComplianceStatus(supplier.address, true);
    await factorFi.updateComplianceStatus(anchor.address, true);
    await factorFi.updateComplianceStatus(underwriter.address, true);
    await factorFi.updateComplianceStatus(investor1.address, true);
    await factorFi.updateComplianceStatus(investor2.address, true);

    await factorFi.connect(anchor).registerAnchor('Acme Corp', 950n);

    // Distribute USDC mock tokens to investors
    await usdcMock.transfer(investor1.address, ethers.parseUnits('100000', 6));
    await usdcMock.transfer(investor2.address, ethers.parseUnits('100000', 6));
    await usdcMock.connect(investor1).approve(await factorFi.getAddress(), ethers.MaxUint256);
    await usdcMock.connect(investor2).approve(await marketplace.getAddress(), ethers.MaxUint256);
  });

  it('Should correctly tokenize a funded invoice, list it on OTC marketplace, sell it, and redirect settlement payout', async function () {
    const amount = ethers.parseUnits('10000', 6); // 10,000 USDC
    const latestBlock = await ethers.provider.getBlock('latest');
    const dueDate = BigInt(latestBlock.timestamp) + 30n * 86400n; // 30 days future
    const description = 'Invoice #4455';

    // 1. Submit Invoice
    const descHash = ethers.keccak256(ethers.toUtf8Bytes(description));
    const invoiceHash = ethers.solidityPackedKeccak256(
      ['address', 'uint256', 'uint256', 'bytes32', 'address'],
      [anchor.address, amount, dueDate, descHash, await usdcMock.getAddress()]
    );

    const messageHashBytes = ethers.getBytes(invoiceHash);
    const signature = await underwriter.signMessage(messageHashBytes);

    await factorFi
      .connect(supplier)
      .submitInvoice(anchor.address, amount, dueDate, description, invoiceHash, signature, await usdcMock.getAddress());

    // 2. Approve Invoice
    const invoiceId = 0n;
    await factorFi.connect(anchor).approveInvoice(invoiceId);

    // 3. Fund Invoice
    const discountBps = 300n; // 3%
    await factorFi.connect(investor1).fundInvoice(invoiceId, discountBps);

    // 4. Tokenize Position (Mint Invoice Receipt NFT)
    await factorFi.connect(investor1).tokenizeInvoice(invoiceId);
    expect(await receiptNFT.ownerOf(invoiceId)).to.equal(investor1.address);
    expect(await factorFi.isTokenized(invoiceId)).to.equal(true);

    // 5. Approve Marketplace and List NFT
    await receiptNFT.connect(investor1).approve(await marketplace.getAddress(), invoiceId);
    const listPrice = ethers.parseUnits('9800', 6);
    await marketplace.connect(investor1).listInvoice(invoiceId, listPrice);

    // Verify listed details
    const listing = await marketplace.listings(invoiceId);
    expect(listing.seller).to.equal(investor1.address);
    expect(listing.price).to.equal(listPrice);
    expect(listing.active).to.equal(true);

    // 6. Buy Invoice (Investor 2 buys from Investor 1)
    const initialInvestor1Balance = await usdcMock.balanceOf(investor1.address);
    await marketplace.connect(investor2).buyInvoice(invoiceId);

    // Verify NFT transferred and listing inactivated
    expect(await receiptNFT.ownerOf(invoiceId)).to.equal(investor2.address);
    const updatedListing = await marketplace.listings(invoiceId);
    expect(updatedListing.active).to.equal(false);

    // Verify payment was received
    const postInvestor1Balance = await usdcMock.balanceOf(investor1.address);
    expect(postInvestor1Balance - initialInvestor1Balance).to.equal(listPrice);

    // 7. Anchor Settles Invoice -> Payout redirected to Investor 2
    // Distribute USDC to anchor to settle
    await usdcMock.transfer(anchor.address, amount);
    await usdcMock.connect(anchor).approve(await factorFi.getAddress(), ethers.MaxUint256);

    const initialInvestor2Balance = await usdcMock.balanceOf(investor2.address);

    // Execute settlement
    await factorFi.connect(anchor).settleInvoice(invoiceId);

    const postInvestor2Balance = await usdcMock.balanceOf(investor2.address);
    const expectedPayout = amount - (amount * 50n / 10000n); // 9,950 USDC (10,000 - 0.5% fee)

    // Verify Investor 2 received payout
    expect(postInvestor2Balance - initialInvestor2Balance).to.equal(expectedPayout);

    // Verify Investor 1 did NOT receive additional settlement payout
    const finalInvestor1Balance = await usdcMock.balanceOf(investor1.address);
    expect(finalInvestor1Balance).to.equal(postInvestor1Balance);
  });

  it('Should prevent NFT transfer and marketplace operations post-maturity', async function () {
    const amount = ethers.parseUnits('5000', 6);
    const latestBlock = await ethers.provider.getBlock('latest');
    const dueDate = BigInt(latestBlock.timestamp) + 2n; // Setting dueDate to 2 seconds in the future for testing
    const description = 'Invoice #Maturity';

    const descHash = ethers.keccak256(ethers.toUtf8Bytes(description));
    const invoiceHash = ethers.solidityPackedKeccak256(
      ['address', 'uint256', 'uint256', 'bytes32', 'address'],
      [anchor.address, amount, dueDate, descHash, await usdcMock.getAddress()]
    );

    const messageHashBytes = ethers.getBytes(invoiceHash);
    const signature = await underwriter.signMessage(messageHashBytes);

    await factorFi
      .connect(supplier)
      .submitInvoice(anchor.address, amount, dueDate, description, invoiceHash, signature, await usdcMock.getAddress());

    const invoiceId = 0n;
    await factorFi.connect(anchor).approveInvoice(invoiceId);
    await factorFi.connect(investor1).fundInvoice(invoiceId, 200n);
    await factorFi.connect(investor1).tokenizeInvoice(invoiceId);

    // Wait for maturity
    await new Promise((resolve) => setTimeout(resolve, 2500));

    // Reverts on NFT transfer
    await expect(
      receiptNFT.connect(investor1).transferFrom(investor1.address, investor2.address, invoiceId)
    ).to.be.revertedWith('Maturity reached, trading restricted');

    // Reverts on marketplace listing
    await expect(
      marketplace.connect(investor1).listInvoice(invoiceId, ethers.parseUnits('4900', 6))
    ).to.be.revertedWith('Invoice already past maturity');
  });
});
