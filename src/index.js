// src/index.js

const config = require('./config');
const blockchainService = require('./services/blockchain');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getRandomDelay = (rangeInMinutes) => {
    const { min, max } = rangeInMinutes;
    const minutes = Math.random() * (max - min) + min;
    console.log(`   - Waiting for ${minutes.toFixed(2)} minutes...`);
    return minutes * 60 * 1000;
};

async function runFullCycle() {
    console.log(`\n================== STARTING NEW CYCLE | ${new Date().toLocaleString()} ==================`);

    const steps = [
        blockchainService.step1_bridgeEthBaseToKite,
        blockchainService.step2_bridgeEthKiteToBase,
        blockchainService.step3_bridgeKiteTokenKiteToBase,
        blockchainService.step4_bridgeKiteTokenBaseToKite,
        blockchainService.step5_bridgeUsdtKiteToBase,
        blockchainService.step6_bridgeUsdtBaseToKite,
    ];

    for (const step of steps) {
        const success = await step();
        if (!success) {
            console.log("Cycle interrupted due to a failed step.");
            return;
        }

        if (step !== steps[steps.length - 1]) {
            await sleep(getRandomDelay(config.BRIDGE_WAIT_TIME_RANGE_MINUTES));
        }
    }

    console.log("\n========================= CYCLE COMPLETED =========================");
}

async function startAutomation() {
    console.log("6-Step Automated Bridging Bot - Initializing...");
    console.log(`Wallet Address: ${config.myAddress}`);

    while (true) {
        await runFullCycle();
        console.log(`\nCycle finished. Waiting for the next cycle to begin.`);
        await sleep(getRandomDelay(config.CYCLE_INTERVAL_RANGE_MINUTES));
    }
}

startAutomation();