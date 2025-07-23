// src/index.js

const config = require('./config');
const BlockchainService = require('./services/blockchain');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getRandomDelay = (rangeInMinutes) => {
    const { min, max } = rangeInMinutes;
    const minutes = Math.random() * (max - min) + min;
    console.log(`   - Waiting for ${minutes.toFixed(2)} minutes...`);
    return minutes * 60 * 1000;
};

async function runFullCycleForService(service) {
    console.log(`\n================== STARTING NEW CYCLE FOR ${service.address} | ${new Date().toLocaleString()} ==================`);

    const steps = [
        service.step1_bridgeEthBaseToKite.bind(service),
        service.step2_bridgeEthKiteToBase.bind(service),
        service.step3_bridgeKiteTokenKiteToBase.bind(service),
        service.step4_bridgeKiteTokenBaseToKite.bind(service),
        service.step5_bridgeUsdtKiteToBase.bind(service),
        service.step6_bridgeUsdtBaseToKite.bind(service),
    ];

    for (const step of steps) {
        const success = await step();
        if (!success) {
            // Jika sebuah langkah gagal, catat pesannya dan lanjutkan ke langkah berikutnya.
            console.log(`   -> Step failed. Skipping to the next step.`);
        }

        // Jeda akan tetap berjalan baik langkah sebelumnya berhasil atau gagal.
        if (step !== steps[steps.length - 1]) {
            await sleep(getRandomDelay(config.BRIDGE_WAIT_TIME_RANGE_MINUTES));
        }
    }

    console.log(`\n========================= CYCLE COMPLETED FOR ${service.address} =========================`);
}

async function startAutomation() {
    console.log(`Multi-Account Bridging Bot - Initializing with ${config.privateKeys.length} account(s)...`);

    while (true) {
        // Select a random account for this cycle
        const randomKey = config.privateKeys[Math.floor(Math.random() * config.privateKeys.length)];
        const service = new BlockchainService(randomKey);

        await runFullCycleForService(service);
        
        console.log(`\nCycle finished. Waiting for the next cycle to begin.`);
        await sleep(getRandomDelay(config.CYCLE_INTERVAL_RANGE_MINUTES));
    }
}

startAutomation();