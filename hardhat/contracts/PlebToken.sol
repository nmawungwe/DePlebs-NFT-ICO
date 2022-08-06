//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IDePlebsNFT.sol";

contract PlebToken is ERC20, Ownable {

    // Price of one Pleb token
    uint256 public constant tokenPrice = 0.001 ether;

      // Each NFT would give the user 10 tokens
      // It needs to be represented as 10 * (10 ** 18) as ERC20 tokens are represented by the smallest denomination possible for the token
      // By default, ERC20 tokens have the smallest denomination of 10^(-18). This means, having a balance of (1)
      // is actually equal to (10 ^ -18) tokens.
      // Owning 1 full token is equivalent to owning (10^18) tokens when you account for the decimal places.
      // More information on this can be found in the Freshman Track Cryptocurrency tutorial.

        uint256 public constant tokensPerNFT = 20 * 10**18;
      // The max supply is 200 000 tokens, 100 000 for the OG DePlebs and 100 000 for the public wanting exposure to Pleb ecosystem
        uint256 public constant maxTotalSupply = 200000 * 10**18;

        //DePlebs NFT contract instance 
        IDePlebsNFT DePlebsNFT;

        //Mapping to keep track of which tokenIds have been claimed 
        mapping(uint256 => bool) public tokenIdsClaimed;

        constructor(address _dePlebsNFTContract) ERC20("Pleb Token", "Pb") {
            DePlebsNFT = IDePlebsNFT(_dePlebsNFTContract);
        }

        /**
            @dev Mints `amount` number of Pleb Tokens
            Requirements:
            - `msg.value` should be equal to greater than the tokenPrice * amount
         */

         function mint(uint256 amount) public payable {
            // the value of ether that should be equal or greater than tokenPrice * amount;
            uint256 _requiredAmount = tokenPrice * amount;
            require(msg.value >= _requiredAmount, "Ether sent is incorrect");
            // converting amount to Wei 
            uint256 amountWithDecimals = amount * 10**18;
            
            //Ensure you dont mint more than total max supply;
            require(
                (totalSupply() + amountWithDecimals <= maxTotalSupply), "Exceeds the max total supply available."
            );
            // call the internal function from Openzeppelin's ERC20 contract 
            _mint(msg.sender, amountWithDecimals);
         }

         /**
            @dev Mints tokens based on the number of NFTs held by the sender
            Requirements
            balance of DePleb NFTs owned by sender should be greater than 0
            Tokens should have not been claimed for all the NFTs held by the msg.sender address
          */

          function claim() public {
            
            address sender = msg.sender;
            // Get the number of DePleb NFTs held by a give address
            uint256 balance = DePlebsNFT.balanceOf(sender);
            // If the balance is zero, revert the transaction
            require(balance > 0, "You do not own any Depleb NFTs");
            // loop over the balance and get the token ID owned by the `sender` at a given index of its token list 

            uint256 amount = 0;
             
            for (uint256 i = 0; i < balance; i++) {
                uint256 tokenId = DePlebsNFT.tokenOfOwnerByIndex(sender, i);
                // if the tokenId has not been claimed, increase the amount
                if (!tokenIdsClaimed[tokenId]) {
                    amount += 1;
                    tokenIdsClaimed[tokenId] = true;
                } 
            }
            // If all the token Ids have been claimed, revert the transaction 
            require(amount > 0, "You have already claimed your tokens");
            // call the internal function from Openzeppelin's ERC20 contract
            // Mint (amount * 20) tokens for each DePleb NFT
            _mint(sender, amount * tokensPerNFT);
          }

          /**
            @dev withdraws all ETH and tokens sent to the contract
            Requirements
            wallet connected must be owner's address
           */

           function withdraw() public onlyOwner {
                address _owner = owner();
                uint256 amount = address(this).balance;
                (bool sent, ) = _owner.call{value: amount}("");
                require(sent, "Failed to send Ether");
           }

           // Function to receive Ether. msg.data must be empty
           receive() external payable {}

           // Function to receive Ether. msg.data no empty
           fallback() external payable {}
}