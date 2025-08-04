// src/config.js

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

if (!process.env.PRIVATE_KEYS) {
    console.error("Error: Please set PRIVATE_KEYS in your .env file.");
    process.exit(1);
}

module.exports = {
    // Credentials & Network
    privateKeys: process.env.PRIVATE_KEYS.split(',').map(key => key.trim()),
    baseRpcUrl: process.env.BASE_SEPOLIA_RPC_URL,
    kiteRpcUrl: process.env.KITE_TESTNET_RPC_URL,

    // Chain IDs
    BASE_CHAIN_ID: 84532,
    KITE_CHAIN_ID: 2368,

    // --- Humanization Settings ---
    AMOUNT_ETH_RANGE: { min: 0.001, max: 0.0015 },
    AMOUNT_KITE_TOKEN_RANGE: { min: 0.1, max: 0.3 },
    AMOUNT_USDT_RANGE: { min: 0.1, max: 0.15 },
    AMOUNT_SWAP_KITE_RANGE: { min: 0.01, max: 0.03 },
    AMOUNT_SWAP_USDT_RANGE: { min: 0.1, max: 0.15 },
    USDT_DECIMALS: 6,
    KITE_DECIMALS: 18,

    BRIDGE_WAIT_TIME_RANGE_MINUTES: { min: 3, max: 5 },
    CYCLE_INTERVAL_RANGE_MINUTES: { min: 15, max: 25 },

    // --- Contract Addresses ---
    ETH_BRIDGE_BASE: "0x226D7950D4d304e749b0015Ccd3e2c7a4979bB7C",
    ETH_BRIDGE_KITE: "0x7AEFdb35EEaAD1A15E869a6Ce0409F26BFd31239",

    KITE_TOKEN_BRIDGE_BASE: "0xFB9a6AF5C014c32414b4a6e208a89904c6dAe266",
    KITE_TOKEN_BRIDGE_KITE: "0x0BBB7293c08dE4e62137a557BC40bc12FA1897d6",

    USDT_TOKEN_KITE: "0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63",
    USDT_BRIDGE_KITE: "0xD1bd49F60A6257dC96B3A040e6a1E17296A51375",
    USDT_BRIDGE_BASE: "0xdAD5b9eB32831D54b7f2D8c92ef4E2A68008989C",

    SWAP_ROUTER_KITE: "0x04CfcA82fDf5F4210BC90f06C44EF25Bf743D556",
    WKITE_ADDRESS_KITE: "0x3bC8f037691Ce1d28c0bB224BD33563b49F99dE8",

    // --- ABIs --- (Now imported from separate files)
    USDT_ABI: require('./abi/usdt.json'),
    SWAP_ROUTER_ABI: require('./abi/swapRouter.json'),
    
    // --- Swap Instructions (Structured as Objects for clarity and correctness) ---
    INSTRUCTIONS_USDT_TO_KITE: {
        sourceId: "1",
        receiver: "0xbf4493f355266f9cB3a8cd8D9aF91fB831596bc1",
        payableReceiver: true,
        rollbackReceiver: "0xbf4493f355266f9cB3a8cd8D9aF91fB831596bc1",
        rollbackTeleporterFee: "0",
        rollbackGasLimit: "500000",
        hops: [{
            action: 3,
            requiredGasLimit: "2620000",
            recipientGasLimit: "2120000",
            trade: "0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000032647e6ed90bf84000000000000000000000000000000000000000000000000032443e1dee439ea00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000ff5393387ad2f9f691fd6fd28e07e3969e27e630000000000000000000000003bc8f037691ce1d28c0bb224bd33563b49f99de8",
            bridgePath: {
                bridgeSourceChain: "0x0000000000000000000000000000000000000000",
                sourceBridgeIsNative: false,
                bridgeDestinationChain: "0x0000000000000000000000000000000000000000",
                cellDestinationChain: "0x04CfcA82fDf5F4210BC90f06C44EF25Bf743D556",
                destinationBlockchainID: "0x6715950e0aad8a92efaade30bd427599e88c459c2d8e29ec350fc4bfb371a114",
                teleporterFee: "0",
                secondaryTeleporterFee: "0"
            }
        }]
    },
    INSTRUCTIONS_KITE_TO_USDT: {
        sourceId: "1",
        receiver: "0xbf4493f355266f9cB3a8cd8D9aF91fB831596bc1",
        payableReceiver: false,
        rollbackReceiver: "0xbf4493f355266f9cB3a8cd8D9aF91fB831596bc1",
        rollbackTeleporterFee: "0",
        rollbackGasLimit: "500000",
        hops: [{
            action: 3,
            requiredGasLimit: "2620000",
            recipientGasLimit: "2120000",
            trade: "0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000005939fe6db25163c00000000000000000000000000000000000000000000000005900e38d6c1cb4c00000000000000000000000000000000000000000000000000000000000000020000000000000000000000003bc8f037691ce1d28c0bb224bd33563b49f99de80000000000000000000000000ff5393387ad2f9f691fd6fd28e07e3969e27e63",
            bridgePath: {
                bridgeSourceChain: "0x0000000000000000000000000000000000000000",
                sourceBridgeIsNative: false,
                bridgeDestinationChain: "0x0000000000000000000000000000000000000000",
                cellDestinationChain: "0x04CfcA82fDf5F4210BC90f06C44EF25Bf743D556",
                destinationBlockchainID: "0x6715950e0aad8a92efaade30bd427599e88c459c2d8e29ec350fc4bfb371a114",
                teleporterFee: "0",
                secondaryTeleporterFee: "0"
            }
        }]
    },

    // User agents for randomization in multi-account mode
    USER_AGENTS: [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Safari/605.1.15",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
    ],
};