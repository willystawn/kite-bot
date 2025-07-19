// src/services/blockchain.js

const { ethers } = require('ethers');
const config = require('../config');

// --- Initialization ---
const baseProvider = new ethers.JsonRpcProvider(config.baseRpcUrl);
const baseWallet = new ethers.Wallet(config.privateKey, baseProvider);
const kiteProvider = new ethers.JsonRpcProvider(config.kiteRpcUrl);
const kiteWallet = new ethers.Wallet(config.privateKey, kiteProvider);

// ABIs
const sendAbi = ["function send(uint256 id, address to, uint256 tokenXAmount)"];
const erc20Abi = ["function approve(address spender, uint256 value)"];

// Contract Instances
const ethBridgeOnBase = new ethers.Contract(config.ETH_BRIDGE_BASE, sendAbi, baseWallet);
const ethBridgeOnKite = new ethers.Contract(config.ETH_BRIDGE_KITE, sendAbi, kiteWallet);
const kiteTokenBridgeOnBase = new ethers.Contract(config.KITE_TOKEN_BRIDGE_BASE, sendAbi, baseWallet);
const kiteTokenBridgeOnKite = new ethers.Contract(config.KITE_TOKEN_BRIDGE_KITE, sendAbi, kiteWallet);
const usdtTokenOnKite = new ethers.Contract(config.USDT_TOKEN_KITE, erc20Abi, kiteWallet);
const usdtBridgeOnKite = new ethers.Contract(config.USDT_BRIDGE_KITE, sendAbi, kiteWallet);
const usdtBridgeOnBase = new ethers.Contract(config.USDT_BRIDGE_BASE, sendAbi, baseWallet);

// --- Helper Functions ---
const getRandomValue = (min, max, decimals = 6) => {
    return (Math.random() * (max - min) + min).toFixed(decimals);
};

async function runTransaction(stepName, transactionPromise, amountStr = null) {
    const logAmount = amountStr ? ` | Amount: ${amountStr}` : '';
    console.log(`\n--- [${stepName}${logAmount}] ---`);
    try {
        const tx = await transactionPromise;
        console.log(`   - Transaction sent! Hash: ${tx.hash}`);
        await tx.wait();
        console.log("   - Transaction confirmed successfully.");
        return true;
    } catch (error) {
        console.error("   - [ERROR] Transaction failed:", error.reason || error.message);
        return false;
    }
}

// --- Exported Step Functions ---
module.exports = {
    step1_bridgeEthBaseToKite: () => {
        const amount = getRandomValue(config.AMOUNT_ETH_RANGE.min, config.AMOUNT_ETH_RANGE.max);
        const amountInWei = ethers.parseEther(amount);
        return runTransaction("Step 1/6: Bridge ETH (Base -> KITE)",
            ethBridgeOnBase.send(config.KITE_CHAIN_ID, config.myAddress, amountInWei, { value: amountInWei }), amount
        );
    },

    step2_bridgeEthKiteToBase: () => {
        const amount = getRandomValue(config.AMOUNT_ETH_RANGE.min, config.AMOUNT_ETH_RANGE.max);
        const amountInWei = ethers.parseEther(amount);
        return runTransaction("Step 2/6: Bridge ETH (KITE -> Base)",
            ethBridgeOnKite.send(config.BASE_CHAIN_ID, config.myAddress, amountInWei), amount
        );
    },

    step3_bridgeKiteTokenKiteToBase: () => {
        const amount = getRandomValue(config.AMOUNT_KITE_TOKEN_RANGE.min, config.AMOUNT_KITE_TOKEN_RANGE.max);
        const amountInWei = ethers.parseEther(amount);
        return runTransaction("Step 3/6: Bridge KITE Token (KITE -> Base)",
            kiteTokenBridgeOnKite.send(config.BASE_CHAIN_ID, config.myAddress, amountInWei, { value: amountInWei }), amount
        );
    },

    step4_bridgeKiteTokenBaseToKite: () => {
        console.log("\n--- [Step 4/6: Bridge KITE Token (Base -> KITE)] ---");
        console.log("   - WARNING: This step requires a one-time manual 'approve' transaction on Base Sepolia.");
        const amount = getRandomValue(config.AMOUNT_KITE_TOKEN_RANGE.min, config.AMOUNT_KITE_TOKEN_RANGE.max);
        const amountInWei = ethers.parseEther(amount);
        return runTransaction("", kiteTokenBridgeOnBase.send(config.KITE_CHAIN_ID, config.myAddress, amountInWei), amount);
    },

    step5_bridgeUsdtKiteToBase: async () => {
        const amount = getRandomValue(config.AMOUNT_USDT_RANGE.min, config.AMOUNT_USDT_RANGE.max);
        const amountInUnits = ethers.parseUnits(amount, config.USDT_DECIMALS);
        console.log(`\n--- [Step 5/6: Bridge USDT (KITE -> Base) | Amount: ${amount}] ---`);
        
        const approveSuccess = await runTransaction("5a: Approve USDT on KITE",
            usdtTokenOnKite.approve(config.USDT_BRIDGE_KITE, amountInUnits)
        );
        if (!approveSuccess) return false;
        
        return runTransaction("5b: Send USDT to Bridge on KITE",
            usdtBridgeOnKite.send(config.BASE_CHAIN_ID, config.myAddress, amountInUnits)
        );
    },

    step6_bridgeUsdtBaseToKite: () => {
        const amount = getRandomValue(config.AMOUNT_USDT_RANGE.min, config.AMOUNT_USDT_RANGE.max);
        const amountInUnits = ethers.parseUnits(amount, config.USDT_DECIMALS);
        return runTransaction("Step 6/6: Bridge USDT (Base -> KITE)",
            usdtBridgeOnBase.send(config.KITE_CHAIN_ID, config.myAddress, amountInUnits), amount
        );
    },
};