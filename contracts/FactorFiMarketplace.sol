// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IERC721 {
    function ownerOf(uint256 tokenId) external view returns (address);
    function transferFrom(address from, address to, uint256 tokenId) external;
}

interface IFactorFi {
    function invoices(uint256 invoiceId) external view returns (
        uint256 id,
        address supplier,
        address anchor,
        address investor,
        address token,
        uint256 amount,
        uint256 fundedAmount,
        uint256 discountBps,
        uint256 dueDate,
        uint256 createdAt,
        uint256 fundedAt,
        uint256 settledAt,
        string memory description,
        uint8 status
    );
}

contract FactorFiMarketplace {
    address public factorFi;
    address public receiptNFT;

    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price;
        bool active;
    }

    // Mapping from NFT token ID (invoice ID) to Listing
    mapping(uint256 => Listing) public listings;
    uint256[] public activeListingIds;

    event InvoiceListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event ListingCancelled(uint256 indexed tokenId);
    event InvoiceSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);

    constructor(address _factorFi, address _receiptNFT) {
        require(_factorFi != address(0), "Invalid FactorFi address");
        require(_receiptNFT != address(0), "Invalid Receipt NFT address");
        factorFi = _factorFi;
        receiptNFT = _receiptNFT;
    }

    function listInvoice(uint256 tokenId, uint256 price) external {
        require(IERC721(receiptNFT).ownerOf(tokenId) == msg.sender, "Not the NFT owner");
        require(price > 0, "Price must be > 0");

        // Maturity Check
        (, , , , , , , , uint256 dueDate, , , , , uint8 status) = IFactorFi(factorFi).invoices(tokenId);
        require(block.timestamp < dueDate, "Invoice already past maturity");
        require(status == 2, "Invoice must be in Funded status"); // 2 = Funded

        listings[tokenId] = Listing({
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            active: true
        });

        // Add to active listings if not already present
        bool found = false;
        for (uint256 i = 0; i < activeListingIds.length; i++) {
            if (activeListingIds[i] == tokenId) {
                found = true;
                break;
            }
        }
        if (!found) {
            activeListingIds.push(tokenId);
        }

        emit InvoiceListed(tokenId, msg.sender, price);
    }

    function cancelListing(uint256 tokenId) external {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Listing not active");
        require(listing.seller == msg.sender, "Not the seller");

        listing.active = false;
        _removeFromActiveListings(tokenId);

        emit ListingCancelled(tokenId);
    }

    function buyInvoice(uint256 tokenId) external {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Listing not active");

        address seller = listing.seller;
        uint256 price = listing.price;

        // Verify seller is still owner
        require(IERC721(receiptNFT).ownerOf(tokenId) == seller, "Seller no longer owns NFT");

        // Maturity & Status check
        (, , , , address token, , , , uint256 dueDate, , , , , uint8 status) = IFactorFi(factorFi).invoices(tokenId);
        require(block.timestamp < dueDate, "Invoice past maturity, trading restricted");
        require(status == 2, "Invoice must be in Funded status");

        // Mark inactive first to prevent re-entrancy
        listing.active = false;
        _removeFromActiveListings(tokenId);

        // Transfer payment from buyer to seller
        require(IERC20(token).transferFrom(msg.sender, seller, price), "Stablecoin transfer failed");

        // Transfer NFT from seller to buyer
        IERC721(receiptNFT).transferFrom(seller, msg.sender, tokenId);

        emit InvoiceSold(tokenId, seller, msg.sender, price);
    }

    function getActiveListings() external view returns (Listing[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < activeListingIds.length; i++) {
            if (listings[activeListingIds[i]].active) {
                activeCount++;
            }
        }

        Listing[] memory result = new Listing[](activeCount);
        uint256 idx = 0;
        for (uint256 i = 0; i < activeListingIds.length; i++) {
            uint256 id = activeListingIds[i];
            if (listings[id].active) {
                result[idx] = listings[id];
                idx++;
            }
        }
        return result;
    }

    function _removeFromActiveListings(uint256 tokenId) internal {
        for (uint256 i = 0; i < activeListingIds.length; i++) {
            if (activeListingIds[i] == tokenId) {
                activeListingIds[i] = activeListingIds[activeListingIds.length - 1];
                activeListingIds.pop();
                break;
            }
        }
    }
}
