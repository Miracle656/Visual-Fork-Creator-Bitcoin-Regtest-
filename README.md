# Visual Fork Creator (Bitcoin Regtest)

A real-time, interactive developer tool for visualizing and modeling blockchain forks and reorganizations on a local Bitcoin Regtest network. 

Built as a capstone project for the BOSS curriculum, this tool replaces manual, confusing CLI commands with a clean, drag-and-drop dashboard powered by Next.js and React Flow, allowing developers to safely test their wallets and applications against chain splits and stale blocks.

## ✨ Features

- **Interactive Block Graph:** Algorithmically visualizes your local Regtest chain, distinguishing cleanly between the active Main Chain (Orange) and stale/orphaned forks (Red/Gray).
- **Targeted Fork Mining:** Click on *any* historic block to instantly mine a new block extending that specific branch.
- **Trigger Chain Reorgs:** Continue mining on a stale branch until it overtakes the main chain. The UI will instantly reflect the reorganization as the node updates its best tip.
- **Invalidate Blocks:** Simulate consensus failures or network rollbacks by "invalidating" a block. The targeted chain instantly grays out, disabling further interaction, just as Bitcoin Core would orphan it.
- **Custom Native RPC Client:** Built from scratch using modern `fetch()` without relying on deprecated or vulnerable NPM packages, ensuring strict handling of Regtest parameters.

## 🛠️ Architecture

- **Frontend:** Next.js (App Router), React, Tailwind CSS, `react-hot-toast` for elegant notifications.
- **Graphing Engine:** `@xyflow/react` (React Flow) for rendering programmatic 2D nodes and connecting vector edges.
- **Backend Bridge:** Next.js Serverless API routes (`/api/blocks`, `/api/mine`, `/api/invalidate`) orchestrating the complex chain traversal logic securely on the server.
- **Bitcoin Interaction:** Direct JSON-RPC communication to a local isolated `bitcoind` daemon running Regtest.

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18+)
- **Bitcoin Core** (`bitcoind` and `bitcoin-cli` installed and accessible in your path).

### 2. Configure Your Local Node
Because this tool heavily manipulates chain tips, it's recommended to run a dedicated regtest data directory so you don't corrupt your daily testing environment.

Open a terminal and spawn your isolated Regtest environment:
```bash
bitcoind -regtest -daemon -datadir=~/fork-creator-data -rpcuser=student -rpcpassword=boss2026 -rpcport=18443
```
*(Wait a few seconds for the daemon to start up successfully)*

### 3. (Optional) Custom RPC Credentials
By default, the application connects using the credentials `student` / `boss2026` on port `18443`. If you wish to use your own node credentials, simply create a `.env.local` file in the root of the project:

```env
BITCOIN_RPC_USER=your_custom_user
BITCOIN_RPC_PASSWORD=your_custom_password
BITCOIN_RPC_PORT=18443
BITCOIN_RPC_HOST=127.0.0.1
```

### 4. Install & Run the Frontend
In a new terminal, clone this repository and install its dependencies:

```bash
npm install
npm run dev
```

Navigate to `http://localhost:3000` in your browser. You should see the Genesis block ready and waiting!

## 🖱️ How to Use

1. **Mine a Block:** Look for the floating "Mine Block (Active Tip)" button to generate standard blocks.
2. **Create a Fork:** Click on an older block in the chain to select it. The floating button will transform to "Mine on Selected Fork". Click it to branch off.
3. **Trigger Reorg:** Select the tip of your new fork and rapidly mine several blocks on it. Once your fork length exceeds the Main Chain, the UI will swap their colors, successfully proving an active Reorganization.
4. **Invalidate:** Select any active or stale block tip and click "Invalidate Block" (red button). The node will abandon that branch, and the UI will flag the branch as legally dead/invalidated.

## 📜 Commands Reference
Behind the scenes, the GUI maps exclusively to these raw Bitcoin CLI commands:
- `getchaintips`
- `getblockheader`
- `generatetoaddress`
- `getbestblockhash`
- `invalidateblock`
- `reconsiderblock`

---
*Built for the BOSS Bitcoin Developer Track*
