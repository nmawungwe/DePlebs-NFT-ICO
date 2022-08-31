import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import React, { useEffect, useState, useRef } from "react";
import {
  NFT_CONTRACT_ADDRESS,
  NFT_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI
} from "../constants";
import Web3Modal from "web3modal";
import { providers, BigNumber, Contract, utils } from "ethers";


export default function Home() {
  // just trying to test something
  // create a BigNumber `0`
  const zero = BigNumber.from(0);

  // walletConnected keeps track of whether user's wallet is connected or not 
  const [walletConnected, setWalletConnected] = useState(false); 
  // track how many pleb tokens have been minted from the contract 
  const [tokensMinted, setTokensMinted] = useState(zero); 
  // track the balance of pleb tokens from the connected wallet
  const [balanceOfPlebTokens, setBalanceOfPlebTokens] = useState(zero);
  // track the balance of pleb tokens to be claimed if you own NFT
  const [unClaimedPlebTokens, setUnClaimedPlebTokens] = useState(zero);
  // track when a function starts loading and when it stops 
  const [loading, setLoading] = useState(false);
  // track token amount to mint/buy if none to claim
  const [tokenAmount, setTokenAmount] = useState(zero);
  // track the owner of the Pleb Token Contract
  const [isOwner, setIsOwner] = useState(false);

  const web3ModalRef = useRef();

  const getProviderOrSigner = async (needSigner=false) => {
    // Connect to Metamask
    // Since we store `web3Modal` as a reference, we need to access the current value to get access 
    // to the underlying object
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // If user is not connected to the Rinkeby network, let them know and throw an error 
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Change the network to Rinkeby");
      throw new Error("Change the network to Rinkeby")
    } 

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  const getPlebTokenBalance = async () => {
    try {
      const provider = await getProviderOrSigner();
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );
      const signer = await getProviderOrSigner(true)
      const address = await signer.getAddress();
      const _plebTokenBalance = await tokenContract.balanceOf(address);
      setBalanceOfPlebTokens(_plebTokenBalance);

    } catch (error) {
      // console.log("What is happening")
      console.error(error);
      setBalanceOfPlebTokens(zero);
    }
  }

  const getTotalTokensMinted = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain   
      const provider = await getProviderOrSigner();
      // Creating instance of token contract 
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );
      // Get the big number value of all the minted tokens
      const _tokensMinted = await tokenContract.totalSupply();
      setTokensMinted(_tokensMinted);
      
    } catch (error) {
      console.error(error)
    }
  }

  const getUnClaimedPlebTokens = async () => {
    try {
      const provider = await getProviderOrSigner()
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      )
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      )
      const signer = await getProviderOrSigner(true)
      const address = signer.getAddress()

      // check if the address has dePleb NFTs 
      const dePlebNftAmount = await nftContract.balanceOf(address)
      if (dePlebNftAmount === 0) {
          setUnClaimedPlebTokens(zero);
      } else {
        // amount keeps track of the number of unclaimed tokens 
        var amount = 0;
        // For all the NFTs, check if the tokens have already been claimed
        // Only increase the amount if the tokens have not been claimed 
        for (var i = 0; i < dePlebNftAmount; i++) {
          const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
          const claimed = await tokenContract.tokenIdsClaimed(tokenId);
          if (!claimed) {
            amount++;
          }
        }
          //pleb tokens to be claimed has been initialised to a Big Number, thus we should convert
          // amount to a big Number and then set is value
          setUnClaimedPlebTokens(BigNumber.from(amount))
      }
      
    } catch (error) {
      console.error(error);
    }
  }

  const claimPlebTokens = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract (
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );
      const tx = await tokenContract.claim();
      setLoading(true)
      await tx.wait()
      setLoading(false)
      window.alert("You have successfully claimed to Pleb tokens")
      await getPlebTokenBalance();
      await getTotalTokensMinted();
      await getUnClaimedPlebTokens();
      await getOwner();
    } catch (error) {
      console.error(error);
    }
  }

  const mintPlebTokens = async (amount) => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );
      // Each token is of `0.001 ether`. The value we need to send is `0.001 * amount`
      const value = 0.001 * amount;
      const tx = await tokenContract.mint(amount, {
        // value signifies the cost of one depleb NFT which is 0.001 Eth.
        // We parsing `0.001` string to ether using the utils library from ether.js
        value: utils.parseEther(value.toString()) 
      });
      setLoading(true);
      // wait for transaction to get mined 
      await tx.wait();
      setLoading(false);
      window.alert("Successfully minted Pleb tokens🥳");
      await getPlebTokenBalance();
      await getTotalTokensMinted();
      await getUnClaimedPlebTokens();
      await getOwner();
    } catch (error) {
      console.error(error)
    }
  }

  const getOwner = async() => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );

      const address = await signer.getAddress();
      const ownerAddress = await tokenContract.owner();

      if (address.toLowerCase()=== ownerAddress.toLowerCase()) {
        setIsOwner(true);
      } else {
        setIsOwner(false);
      }

      
    } catch (error) {
      console.error(error);
    }
  }

  const withdraw = async() => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );
      const tx = await tokenContract.withdraw();
      setLoading(true);
      await tx.wait();
      setLoading(false);
      window.alert("You have successfully withdrawn Eth from the Pleb Token ICO Contract🥳!")
    } catch (error) {
      console.error(error)
    }
  }

  const connectWallet = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask 
      // When used for the first time, it prompts the user to connect their wallet 
      await getProviderOrSigner();
      setWalletConnected(true); 
    } catch (error) {
      console.error(error);
    }
  };

  // useEffects are used to react to changes in the website state
  // the array at the end of the function call represents what state changes will trigger this effect
  // In our case, when the value of `walletConnected` changes - this effect will be called 
  useEffect(() => {
    // if wallet is not connected, create new instance of Web3Modal and connect the Metamask Wallet 
    if (!walletConnected) {
      // Assign the Web3Modal class to the reference object by setting it's `current` value 
      // The `current` value is persisted throughout as long as this page is open  
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      // connect the wallet
      connectWallet();
      getTotalTokensMinted();
      getPlebTokenBalance();
      getUnClaimedPlebTokens();
      getOwner();
    }
  }, [walletConnected]);

  const renderButton = () => {
    // If currently waiting show a loading message
    if (loading) {
      return (
        <div>
          <button className={styles.button}>Loading...</button>
        </div>
      )
    }

    if (unClaimedPlebTokens > 0) {
      return (
        <div>
          <div className={styles.description}>You can claim {utils.formatEther(unClaimedPlebTokens) * 20 * 10**18} Pleb Tokens</div>
          <button className={styles.button} onClick={claimPlebTokens}>Claim</button>
        </div>
      )
    }

    if (isOwner) {
      return(
        <div>
          <button className={styles.button} onClick={withdraw}>Withdraw</button>
        </div>
      )
    }
    
    return (
      <div style={{ display: "flex-col" }}>
        <div>
          <input
            type="number"
            placeholder="Amount of Tokens"
            // BigNumber from, converts the `e.target.value` to a BigNumber 
            onChange={(e) => setTokenAmount(BigNumber.from(e.target.value))}
            className={styles.input} 
          />
        </div>
        <button 
          className={styles.button}
          disabled={!(tokenAmount > 0)}
          onClick={() => mintPlebTokens(tokenAmount)}>
          Mint Tokens
        </button>
      </div>
      );
    };

  return (
    <div>
      <Head>
        <title>DePlebs NFT</title>
        <meta name="description" content="ICO-Dapp" />
        <link rel="icon" href="/DePleb.ico"/>
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}> Welcome to DePlebs ICO!</h1>
          <div className={styles.description}>
            You can claim or mint Pleb tokens here
          </div>
          {walletConnected ? (
            <div>
              <div className={styles.description}>
                You have minted {utils.formatEther(balanceOfPlebTokens)} Pleb Tokens.
              </div>
              <div className={styles.description}>
                {/*Format Ether helps us in converting a BigNumber to string */}
                Overall {utils.formatEther(tokensMinted)}/200 000 have been minted!!!
              </div>
                {/* <button className={styles.button}>Mint</button> */}
                {renderButton()}
            </div>
          ) : (
              <button className={styles.button} onClick={connectWallet}>
                Connect Wallet
              </button>
          )}
        </div>
        <div>
            <img className={styles.image} src="./1.png" />
        </div>
      </div>
      <footer className={styles.footer}>
        Made with &#10084; by Alisa 
      </footer>
    </div>
  )
}
