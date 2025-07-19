// src/config.js

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { ethers } = require('ethers');

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
    AMOUNT_ETH_RANGE: { min: 0.01, max: 0.012 },
    AMOUNT_KITE_TOKEN_RANGE: { min: 1.0, max: 1.2 },
    AMOUNT_USDT_RANGE: { min: 0.1, max: 0.15 },
    USDT_DECIMALS: 6,

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

    // User agents for randomization in multi-account mode
    USER_AGENTS: [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Safari/605.1.15",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
    ],
};