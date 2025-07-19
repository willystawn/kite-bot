# Advanced Multi-Account Bridging Bot

This is an automated bot designed to perform a cycle of bridging transactions between the Base Sepolia and KITE test networks. It is built with advanced features for simulating human behavior, including multi-account support, randomized amounts, randomized delays, and randomized RPC user agents.

## Core Features

-   **Multi-Account Support**: Manages multiple wallets from a single `.env` file.
-   **Randomized Execution**: The bot randomly selects an account to run a full 6-step cycle, making its activity pattern less predictable.
-   **Humanized Transactions**: All transaction amounts and delays between steps are randomized within a configurable range.
-   **User-Agent Randomization**: When running in multi-account mode, each RPC request is sent with a different, randomized `User-Agent` header to mimic requests from various browsers and devices. This is a powerful anti-sybil measure.
-   **Full Bridging Cycle**:
    1.  Bridge ETH (Base -> KITE)
    2.  Bridge ETH (KITE -> Base)
    3.  Bridge KITE Token (KITE -> Base)
    4.  Bridge KITE Token (Base -> KITE)
    5.  Bridge USDT (KITE -> Base)
    6.  Bridge USDT (Base -> KITE)

## Prerequisites

-   [Node.js](https://nodejs.org/) (v18+ recommended).
-   One or more Ethereum wallets with their Private Keys.
-   Native token balances in **each wallet** on both networks for gas fees.

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
    Open the `.env` file and add your private keys to the `PRIVATE_KEYS` variable. **Separate multiple keys with a comma and no spaces.**

## **CRITICAL: Manual Approval Required**

Before running the bot, you **MUST** perform **ONE manual `approve` transaction** on the **Base Sepolia** network for **EACH ACCOUNT** you intend to use.

1.  **Approve KITE Token (for Step 4):**
    -   **Network:** Base Sepolia
    -   **Token to Approve:** The KITE Token contract address on Base Sepolia.
    -   **Spender (Address to grant permission to):** `0xFB9a6AF5C014c32414b4a6e208a89904c6dAe266` (The KITE Token Bridge contract).

> **Failure to perform this manual approval will cause Step 4 of the bot to fail for that specific account.**

## Running the Bot

Once setup is complete, run the bot using:

```bash
npm start
```

The bot will randomly select an account, run a full cycle, and then wait for a random interval before starting the next cycle with another randomly selected account.

## Configuration

You can customize the bot's behavior by editing `src/config.js`:
-   Modify the amount ranges (`AMOUNT_..._RANGE`).
-   Adjust the delay ranges (`..._RANGE_MINUTES`).
-   Add or remove `USER_AGENTS` for randomization in multi-account mode.