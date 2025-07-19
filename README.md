# Multi-Network Bridging Bot

This is an automated bot designed to perform a cycle of bridging transactions between the Base Sepolia and KITE test networks. It incorporates randomized amounts and delays to better simulate human behavior.

## Features

The bot executes a 6-step cycle in a loop:
1.  **Bridge ETH**: From Base Sepolia to KITE Testnet.
2.  **Bridge ETH**: From KITE Testnet back to Base Sepolia.
3.  **Bridge KITE Token**: From KITE Testnet to Base Sepolia.
4.  **Bridge KITE Token**: From Base Sepolia back to KITE Testnet.
5.  **Bridge USDT**: From KITE Testnet to Base Sepolia (includes an automatic `approve` transaction).
6.  **Bridge USDT**: From Base Sepolia back to KITE Testnet.

To avoid detection, all transaction amounts and delays between steps are randomized within a configurable range.

## Prerequisites

-   [Node.js](https://nodejs.org/) (v18+ recommended).
-   An Ethereum wallet (e.g., MetaMask) with its Private Key.
-   Native token balances on both networks for gas fees:
    -   ETH on Base Sepolia.
    -   The native token on KITE Testnet.

## Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd auto-tx-bot
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up the environment file:**
    Copy `example.env` to a new file named `.env`.
    ```bash
    cp example.env .env
    ```

4.  **Edit the `.env` file:**
    Open the `.env` file and fill in your `PRIVATE_KEY` and RPC URLs.

## **CRITICAL: Manual Approval Required**

Before running the bot for the first time, you **MUST** perform **ONE manual `approve` transaction** on the **Base Sepolia** network. This is a one-time setup per wallet.

1.  **Approve KITE Token (for Step 4):**
    -   **Network:** Base Sepolia
    -   **Token to Approve:** The KITE Token contract address on Base Sepolia.
    -   **Spender (Address to grant permission to):** `0xFB9a6AF5C014c32414b4a6e208a89904c6dAe266` (The KITE Token Bridge contract).

> **Failure to perform this manual approval will cause Step 4 of the bot to fail every time.**
> Note: Step 6 (bridging USDT from Base) does not require manual approval.

## Running the Bot

Once setup is complete, run the bot using the following command:

```bash
npm start
```

The bot will start its transaction cycle, logging each action to the console. To stop it, press `Ctrl + C`.

## Configuration

You can customize the bot's behavior by editing `src/config.js`:
-   Modify the amount ranges for each token (`AMOUNT_..._RANGE`).
-   Adjust the delay ranges between steps (`BRIDGE_WAIT_TIME_RANGE_MINUTES`).
-   Change the delay range between full cycles (`CYCLE_INTERVAL_RANGE_MINUTES`).