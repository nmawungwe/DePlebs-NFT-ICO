const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env"});
const { DEPLEBS_NFT_CONTRACT_ADDRESS } = require("../constants");

async function main() {
  // Address of the DePlebs NFT collection contract to checkout owners
  const dePlebsNFTContract = DEPLEBS_NFT_CONTRACT_ADDRESS;
  
  /**
   * A ContractFactory in ethers.js is an abstraction used to deploy smart contracts 
   */

  const plebTokenContract = await ethers.getContractFactory(
    "PlebToken"
  );

  //deploy the contract
  const deployedPlebTokenContract = await plebTokenContract.deploy(
    dePlebsNFTContract
  );

  // printing the address of the deployed contract 
  console.log("Pleb Token Contract Address: ", deployedPlebTokenContract.address);
  
}

// Call the main function and catch if there is any error

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })