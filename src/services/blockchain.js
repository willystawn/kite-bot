// src/services/blockchain.js

const { ethers } = require('ethers');
const config = require('../config');

// A custom provider that injects a random User-Agent header into each request.
class RandomAgentJsonRpcProvider extends ethers.JsonRpcProvider {
    constructor(url) {
        super(url);
    }
    
    // This is the method ethers.js uses to send requests. We override it.
    async _send(payload) {
        // We can't modify the headers of the built-in fetch, so we perform our own.
        // This is a more robust way to ensure headers are set correctly.
        const request = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "User-Agent": config.USER_AGENTS[Math.floor(Math.random() * config.USER_AGENTS.length)],
            },
            body: JSON.stringify(payload),
        };

        const response = await fetch(this.connection.url, request);
        const data = await response.json();

        if (!response.ok) {
            const error = new Error(data.error?.message || `Request failed with status ${response.status}`);
            error.code = data.error?.code;
            error.data = data.error?.data;
            throw error;
        }
        
        return data;
    }
}

// A factory class to create a blockchain interaction service for a specific account.
class BlockchainService {
    constructor(privateKey) {
        this.privateKey = privateKey;
        this.wallet = new ethers.Wallet(privateKey);
        this.address = this.wallet.address;

        const isMultiAccount = config.privateKeys.length > 1;

        // Use the random-agent provider only in multi-account mode
        const ProviderClass = isMultiAccount ? RandomAgentJsonRpcProvider : ethers.JsonRpcProvider;
        
        const baseProvider = new ProviderClass(config.baseRpcUrl);
        const kiteProvider = new ProviderClass(config.kiteRpcUrl);

        const baseWallet = this.wallet.connect(baseProvider);
        const kiteWallet = this.wallet.connect(kiteProvider);

        // ABIs
        const sendAbi = ["function send(uint256 id, address to, uint256 tokenXAmount)"];
        const erc20Abi = ["function approve(address spender, uint256 value)"];

        // Create all contract instances for this specific account
        this.contracts = {
            ethBridgeOnBase: new ethers.Contract(config.ETH_BRIDGE_BASE, sendAbi, baseWallet),
            ethBridgeOnKite: new ethers.Contract(config.ETH_BRIDGE_KITE, sendAbi, kiteWallet),
            kiteTokenBridgeOnBase: new ethers.Contract(config.KITE_TOKEN_BRIDGE_BASE, sendAbi, baseWallet),
            kiteTokenBridgeOnKite: new ethers.Contract(config.KITE_TOKEN_BRIDGE_KITE, sendAbi, kiteWallet),
            usdtTokenOnKite: new ethers.Contract(config.USDT_TOKEN_KITE, erc20Abi, kiteWallet),
            usdtBridgeOnKite: new ethers.Contract(config.USDT_BRIDGE_KITE, sendAbi, kiteWallet),
            usdtBridgeOnBase: new ethers.Contract(config.USDT_BRIDGE_BASE, sendAbi, baseWallet),
        };
    }

    getRandomValue(min, max, decimals = 6) {
        return (Math.random() * (max - min) + min).toFixed(decimals);
    }

    async runTransaction(stepName, transactionPromise, amountStr = null) {
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

    // --- Step Methods ---
    step1_bridgeEthBaseToKite() {
        const amount = this.getRandomValue(config.AMOUNT_ETH_RANGE.min, config.AMOUNT_ETH_RANGE.max);
        const amountInWei = ethers.parseEther(amount);
        return this.runTransaction("Step 1/6: Bridge ETH (Base -> KITE)",
            this.contracts.ethBridgeOnBase.send(config.KITE_CHAIN_ID, this.address, amountInWei, { value: amountInWei }), amount
        );
    }

    step2_bridgeEthKiteToBase() {
        const amount = this.getRandomValue(config.AMOUNT_ETH_RANGE.min, config.AMOUNT_ETH_RANGE.max);
        const amountInWei = ethers.parseEther(amount);
        return this.runTransaction("Step 2/6: Bridge ETH (KITE -> Base)",
            this.contracts.ethBridgeOnKite.send(config.BASE_CHAIN_ID, this.address, amountInWei), amount
        );
    }

    step3_bridgeKiteTokenKiteToBase() {
        const amount = this.getRandomValue(config.AMOUNT_KITE_TOKEN_RANGE.min, config.AMOUNT_KITE_TOKEN_RANGE.max);
        const amountInWei = ethers.parseEther(amount);
        return this.runTransaction("Step 3/6: Bridge KITE Token (KITE -> Base)",
            this.contracts.kiteTokenBridgeOnKite.send(config.BASE_CHAIN_ID, this.address, amountInWei, { value: amountInWei }), amount
        );
    }

    step4_bridgeKiteTokenBaseToKite() {
        console.log("\n--- [Step 4/6: Bridge KITE Token (Base -> KITE)] ---");
        console.log("   - WARNING: This step requires a one-time manual 'approve' transaction on Base Sepolia.");
        const amount = this.getRandomValue(config.AMOUNT_KITE_TOKEN_RANGE.min, config.AMOUNT_KITE_TOKEN_RANGE.max);
        const amountInWei = ethers.parseEther(amount);
        return this.runTransaction("", this.contracts.kiteTokenBridgeOnBase.send(config.KITE_CHAIN_ID, this.address, amountInWei), amount);
    }

    async step5_bridgeUsdtKiteToBase() {
        const amount = this.getRandomValue(config.AMOUNT_USDT_RANGE.min, config.AMOUNT_USDT_RANGE.max);
        const amountInUnits = ethers.parseUnits(amount, config.USDT_DECIMALS);
        console.log(`\n--- [Step 5/6: Bridge USDT (KITE -> Base) | Amount: ${amount}] ---`);
        
        const approveSuccess = await this.runTransaction("5a: Approve USDT on KITE",
            this.contracts.usdtTokenOnKite.approve(config.USDT_BRIDGE_KITE, amountInUnits)
        );
        if (!approveSuccess) return false;
        
        return this.runTransaction("5b: Send USDT to Bridge on KITE",
            this.contracts.usdtBridgeOnKite.send(config.BASE_CHAIN_ID, this.address, amountInUnits)
        );
    }

    step6_bridgeUsdtBaseToKite() {
        const amount = this.getRandomValue(config.AMOUNT_USDT_RANGE.min, config.AMOUNT_USDT_RANGE.max);
        const amountInUnits = ethers.parseUnits(amount, config.USDT_DECIMALS);
        return this.runTransaction("Step 6/6: Bridge USDT (Base -> KITE)",
            this.contracts.usdtBridgeOnBase.send(config.KITE_CHAIN_ID, this.address, amountInUnits), amount
        );
    }
}

module.exports = BlockchainService;