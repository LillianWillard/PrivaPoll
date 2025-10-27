# PrivaPoll

**Privacy-Preserving Polling Platform with FHEVM**

PrivaPoll is a fully homomorphic encrypted survey dApp built on FHEVM, ensuring poll responses stay private on-chain. The platform supports single and multiple-choice questions, with encrypted `euint32` storage that enables creators to run statistics while individual answers remain never exposed. Using FHEVM's access control, creators can decrypt aggregate results for analysis, while users maintain transparency over their own responses. The end-to-end encryption flow prevents intermediaries from accessing data, meeting GDPR and security requirements while maintaining decentralized governance.

## 🌟 Features

- **End-to-End Encryption**: All responses encrypted on-chain with `euint32`
- **Single & Multiple Choice**: Support for flexible question types
- **Access Control**: Creators can decrypt all responses; participants only their own
- **Privacy-First Design**: No intermediaries can access encrypted data
- **Dual-Mode Support**: Local Mock for development, Relayer SDK for testnet/mainnet
- **Real-Time Statistics**: Decrypted aggregate results with charts
- **Sepolia Deployment**: Live on Sepolia testnet

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MetaMask or compatible wallet
- Sepolia ETH (for testnet usage)

### Installation

```bash
# Clone the repository
git clone https://github.com/LillianWillard/PrivaPoll.git
cd PrivaPoll

# Install contract dependencies
cd fhevm-hardhat-template
npm install

# Install frontend dependencies
cd ../privapoll-frontend
npm install
```

### Development

```bash
# Terminal 1: Start local Hardhat node
cd fhevm-hardhat-template
npx hardhat node

# Terminal 2: Deploy contracts locally
cd fhevm-hardhat-template
npx hardhat deploy --network localhost

# Terminal 3: Start frontend
cd privapoll-frontend
npm run dev:mock
```

Visit http://localhost:3000

### Testnet Usage

1. Switch MetaMask to **Sepolia Testnet** (Chain ID: 11155111)
2. Get Sepolia ETH from [faucet](https://sepoliafaucet.com/)
3. Start frontend:
   ```bash
   cd privapoll-frontend
   npm run dev
   ```

## 📋 Contract Details

**Deployed on Sepolia:**
- **Address**: `0x88dbF661AB56dC5c9aA13762eAae40Bc4765B206`
- **Network**: Sepolia Testnet
- **Chain ID**: 11155111
- **View on Etherscan**: [https://sepolia.etherscan.io/address/0x88dbF661AB56dC5c9aA13762eAae40Bc4765B206](https://sepolia.etherscan.io/address/0x88dbF661AB56dC5c9aA13762eAae40Bc4765B206)

## 🏗️ Project Structure

```
PrivaPoll/
├── fhevm-hardhat-template/   # Smart contracts
│   ├── contracts/             # PrivaPoll.sol
│   ├── deploy/                # Deployment scripts
│   └── test/                  # Contract tests
└── privapoll-frontend/        # Next.js frontend
    ├── app/                   # Next.js App Router
    ├── components/            # React components
    ├── hooks/                 # Custom hooks
    ├── fhevm/                 # FHEVM integration
    └── abi/                   # Generated ABIs
```

## 🔐 Privacy & Security

- **FHEVM Encryption**: All responses encrypted with `euint32`
- **Access Control**: Only poll creators and respondents can decrypt their data
- **No Intermediaries**: End-to-end encryption prevents data leakage
- **GDPR Compliant**: Personal data remains private on public blockchain

## 🛠️ Tech Stack

- **Smart Contracts**: Solidity 0.8.27 + FHEVM 0.8.0
- **Frontend**: Next.js 15 + React 18 + TypeScript
- **Styling**: Tailwind CSS + Glassmorphism design
- **FHEVM**: `@zama-fhe/relayer-sdk` (testnet) / `@fhevm/mock-utils` (local)
- **Testing**: Hardhat + Chai

## 📄 License

MIT

## 👤 Author

**LillianWillard**

- GitHub: [@LillianWillard](https://github.com/LillianWillard)

## 🙏 Acknowledgments

- FHEVM Team for the fully homomorphic encryption technology
- Zama.ai for the Relayer SDK

