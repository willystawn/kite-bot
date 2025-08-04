// src/services/blockchain.js

const { ethers } = require('ethers');
const config = require('../config');

// ... (RandomAgentJsonRpcProvider class remains the same) ...
class RandomAgentJsonRpcProvider extends ethers.JsonRpcProvider {
    constructor(url) {
        super(url);
    }
    
    async _send(payload) {
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


class BlockchainService {
    // ... (constructor and other helper functions remain the same) ...
    constructor(privateKey) {
        this.privateKey = privateKey;
        this.wallet = new ethers.Wallet(privateKey);
        this.address = this.wallet.address;

        const isMultiAccount = config.privateKeys.length > 1;

        const ProviderClass = isMultiAccount ? RandomAgentJsonRpcProvider : ethers.JsonRpcProvider;
        
        const baseProvider = new ProviderClass(config.baseRpcUrl);
        const kiteProvider = new ProviderClass(config.kiteRpcUrl);

        const baseWallet = this.wallet.connect(baseProvider);
        const kiteWallet = this.wallet.connect(kiteProvider);

        const sendAbi = ["function send(uint256 id, address to, uint256 tokenXAmount)"];

        this.contracts = {
            ethBridgeOnBase: new ethers.Contract(config.ETH_BRIDGE_BASE, sendAbi, baseWallet),
            ethBridgeOnKite: new ethers.Contract(config.ETH_BRIDGE_KITE, sendAbi, kiteWallet),
            kiteTokenBridgeOnBase: new ethers.Contract(config.KITE_TOKEN_BRIDGE_BASE, sendAbi, baseWallet),
            kiteTokenBridgeOnKite: new ethers.Contract(config.KITE_TOKEN_BRIDGE_KITE, sendAbi, kiteWallet),
            usdtTokenOnKite: new ethers.Contract(config.USDT_TOKEN_KITE, config.USDT_ABI, kiteWallet),
            usdtBridgeOnKite: new ethers.Contract(config.USDT_BRIDGE_KITE, sendAbi, kiteWallet),
            usdtBridgeOnBase: new ethers.Contract(config.USDT_BRIDGE_BASE, sendAbi, baseWallet),
            swapRouterOnKite: new ethers.Contract(config.SWAP_ROUTER_KITE, config.SWAP_ROUTER_ABI, kiteWallet),
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
            if (error.data) {
                console.error("   - Error Data:", error.data);
            }
            if(error.transaction) {
                console.error("   - Transaction Data:", JSON.stringify(error.transaction, null, 2));
            }
            return false;
        }
    }

    // --- Step Methods (1-6 unchanged) ---
    step1_bridgeEthBaseToKite() {
        const amount = this.getRandomValue(config.AMOUNT_ETH_RANGE.min, config.AMOUNT_ETH_RANGE.max);
        const amountInWei = ethers.parseEther(amount);
        return this.runTransaction("Step 1/8: Bridge ETH (Base -> KITE)",
            this.contracts.ethBridgeOnBase.send(config.KITE_CHAIN_ID, this.address, amountInWei, { value: amountInWei }), amount
        );
    }

    step2_bridgeEthKiteToBase() {
        const amount = this.getRandomValue(config.AMOUNT_ETH_RANGE.min, config.AMOUNT_ETH_RANGE.max);
        const amountInWei = ethers.parseEther(amount);
        return this.runTransaction("Step 2/8: Bridge ETH (KITE -> Base)",
            this.contracts.ethBridgeOnKite.send(config.BASE_CHAIN_ID, this.address, amountInWei), amount
        );
    }

    step3_bridgeKiteTokenKiteToBase() {
        const amount = this.getRandomValue(config.AMOUNT_KITE_TOKEN_RANGE.min, config.AMOUNT_KITE_TOKEN_RANGE.max);
        const amountInWei = ethers.parseEther(amount);
        return this.runTransaction("Step 3/8: Bridge KITE Token (KITE -> Base)",
            this.contracts.kiteTokenBridgeOnKite.send(config.BASE_CHAIN_ID, this.address, amountInWei, { value: amountInWei }), amount
        );
    }

    step4_bridgeKiteTokenBaseToKite() {
        console.log("\n--- [Step 4/8: Bridge KITE Token (Base -> KITE)] ---");
        console.log("   - WARNING: This step requires a one-time manual 'approve' transaction on Base Sepolia.");
        const amount = this.getRandomValue(config.AMOUNT_KITE_TOKEN_RANGE.min, config.AMOUNT_KITE_TOKEN_RANGE.max);
        const amountInWei = ethers.parseEther(amount);
        return this.runTransaction("", this.contracts.kiteTokenBridgeOnBase.send(config.KITE_CHAIN_ID, this.address, amountInWei), amount);
    }

    async step5_bridgeUsdtKiteToBase() {
        const amount = this.getRandomValue(config.AMOUNT_USDT_RANGE.min, config.AMOUNT_USDT_RANGE.max);
        const amountInUnits = ethers.parseUnits(amount, config.USDT_DECIMALS);
        console.log(`\n--- [Step 5/8: Bridge USDT (KITE -> Base) | Amount: ${amount}] ---`);
        
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
        return this.runTransaction("Step 6/8: Bridge USDT (Base -> KITE)",
            this.contracts.usdtBridgeOnBase.send(config.KITE_CHAIN_ID, this.address, amountInUnits), amount
        );
    }

    // --- SWAP METHODS (MODIFIED WITH EXPLICIT PATH) ---

    async step7_swapUsdtToKite() {
        const amount = this.getRandomValue(config.AMOUNT_SWAP_USDT_RANGE.min, config.AMOUNT_SWAP_USDT_RANGE.max, config.USDT_DECIMALS);
        const amountInUnits = ethers.parseUnits(amount, config.USDT_DECIMALS);
        console.log(`\n--- [Step 7/8: Swap USDT -> KITE | Amount: ${amount} USDT] ---`);

        // 1. Approve
        const approveSuccess = await this.runTransaction("7a: Approve USDT for Swap Router",
            this.contracts.usdtTokenOnKite.approve(config.SWAP_ROUTER_KITE, ethers.MaxUint256)
        );
        if (!approveSuccess) return false;
        
        // 2. Generate dynamic `trade` data
        console.log("   - Generating dynamic trade data with explicit path...");
        let tradeData;
        try {
            // Encode the path [USDT, WKITE] as bytes
            const path = [config.USDT_TOKEN_KITE, config.WKITE_ADDRESS_KITE];
            const encodedPath = ethers.AbiCoder.defaultAbiCoder().encode(['address[]'], [path]);

            const routeResult = await this.contracts.swapRouterOnKite.route.staticCall(
                amountInUnits,
                config.USDT_TOKEN_KITE,
                config.WKITE_ADDRESS_KITE,
                encodedPath // Provide the explicit path here
            );
            tradeData = routeResult.trade;
            console.log("   - Dynamic trade data generated successfully.");
        } catch(e) {
            console.error("   - [ERROR] Failed to generate trade data:", e.reason || e.message);
            return false;
        }

        // 3. Build instructions
        const dynamicInstructions = {
            ...config.INSTRUCTIONS_USDT_TO_KITE,
            hops: [{
                ...config.INSTRUCTIONS_USDT_TO_KITE.hops[0],
                trade: tradeData,
            }]
        };

        // 4. Execute swap
        return this.runTransaction("7b: Initiate USDT -> KITE Swap",
            this.contracts.swapRouterOnKite.initiate(
                config.USDT_TOKEN_KITE,
                amountInUnits,
                dynamicInstructions
            )
        );
    }

    async step8_swapKiteToUsdt() {
        const amount = this.getRandomValue(config.AMOUNT_SWAP_KITE_RANGE.min, config.AMOUNT_SWAP_KITE_RANGE.max, config.KITE_DECIMALS);
        const amountInWei = ethers.parseEther(amount);
        console.log(`\n--- [Step 8/8: Swap KITE -> USDT | Amount: ${amount} KITE] ---`);

        // 1. Generate dynamic `trade` data
        console.log("   - Generating dynamic trade data with explicit path...");
        let tradeData;
        try {
            // Encode the path [WKITE, USDT] as bytes
            const path = [config.WKITE_ADDRESS_KITE, config.USDT_TOKEN_KITE];
            const encodedPath = ethers.AbiCoder.defaultAbiCoder().encode(['address[]'], [path]);

            const routeResult = await this.contracts.swapRouterOnKite.route.staticCall(
                amountInWei,
                config.WKITE_ADDRESS_KITE,
                config.USDT_TOKEN_KITE,
                encodedPath // Provide the explicit path here
            );
            tradeData = routeResult.trade;
            console.log("   - Dynamic trade data generated successfully.");
        } catch(e) {
            console.error("   - [ERROR] Failed to generate trade data:", e.reason || e.message);
            return false;
        }

        // 2. Build instructions
        const dynamicInstructions = {
            ...config.INSTRUCTIONS_KITE_TO_USDT,
            hops: [{
                ...config.INSTRUCTIONS_KITE_TO_USDT.hops[0],
                trade: tradeData,
            }]
        };

        // 3. Execute swap
        const nativeTokenAddress = "0x0000000000000000000000000000000000000000";
        return this.runTransaction(`8a: Initiate KITE -> USDT Swap`,
            this.contracts.swapRouterOnKite.initiate(
                nativeTokenAddress,
                amountInWei,
                dynamicInstructions,
                { value: amountInWei }
            )
        );
    }
}

module.exports = BlockchainService;
