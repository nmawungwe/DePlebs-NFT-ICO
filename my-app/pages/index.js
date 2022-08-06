import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import React from "react";
import {
  NFT_CONTRACT_ADDRESS,
  NFT_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI
} from "../constants";
import Web3Modal from "web3modal";
import { providers } from "ethers";


export default function Home() {

  const getProviderOrSigner = async (needSigner=false) => {
    // Connect to Metamask
    // Since we store `web3Modal` as a reference, we need to access the current value to get access 
    // to the underlying object
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // If user is not connected to the Rinkeby network, let them know and throw an error 
    const { chainId } = await web3Provider 


  }

  return (
    <div>

    </div>
  )
}
