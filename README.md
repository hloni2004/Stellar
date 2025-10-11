# SkillLink Africa

## Project Description

SkillLink Africa is a decentralized freelance marketplace built on the Stellar network that connects clients with skilled workers across Africa. The platform uses smart contracts and escrow services to ensure secure, transparent, and trustless transactions. By leveraging blockchain technology, SkillLink Africa eliminates intermediaries, reduces transaction fees, and provides a reliable payment system that addresses trust issues in the African freelance economy.

The platform solves the problem of payment security and trust between freelancers and clients by using automated escrow contracts that hold funds until job completion, ensuring fair compensation for workers and protection for clients.

## Features

- **Job Marketplace**: Browse and post freelance opportunities across various categories
- **Secure Payments**: XLM-based payments with automatic escrow protection
- **Dual Escrow System**:
  - Legacy account-based escrow for standard wallets
  - Modern Soroban smart contract escrow for advanced functionality
- **Wallet Integration**: Seamless Freighter wallet integration for easy transactions
- **Real-time Balance Updates**: Live balance tracking with automatic refresh
- **Transaction History**: Complete record of all payments and job activities
- **User Authentication**: Secure login system with Supabase integration
- **Responsive Design**: Mobile-friendly interface with professional styling
- **Network Status**: Visual indicators for wallet connection and Soroban support

## Tech Stack

### Frontend

- **React.js** - Modern component-based UI framework
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework for responsive design
- **React Router** - Client-side routing for single-page application

### Backend

- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **Supabase** - Backend-as-a-Service with PostgreSQL database

### Blockchain & Smart Contracts

- **Stellar Network** - Fast, low-cost blockchain for payments
- **Soroban** - Stellar's smart contract platform
- **Rust** - Systems programming language for smart contracts
- **Stellar SDK** - JavaScript SDK for blockchain interactions

### Development Tools

- **Stellar Wallets Kit** - Wallet connection abstraction
- **Freighter Wallet** - Browser extension wallet for Stellar
- **Horizon API** - REST API for Stellar network
- **Soroban RPC** - Smart contract execution environment

### Other Tools

- **Git/GitHub** - Version control and repository hosting
- **npm** - Package management
- **ESLint** - Code quality and formatting
- **PostCSS** - CSS processing pipeline

## How to Run the Project

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Freighter Wallet browser extension
- Git

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/hloni2004/Stellar.git
   cd Stellar
   Set up the backend server
   ```

bash
cd server
npm install
cp .env.template .env

# Edit .env file with your configuration

npm start
Set up the frontend client

bash
cd ../client
npm install
npm run dev
Configure environment variables

Update server/.env with your Supabase credentials

Ensure Stellar testnet configuration is correct

Access the application

Frontend: http://localhost:5173

Backend API: http://localhost:3001

Getting Started
Install Freighter wallet extension and set it to Testnet

Fund your wallet with testnet XLM from https://friendbot.stellar.org

Connect your wallet to the application

Browse available jobs or post your own services

Use the secure escrow system to hire workers

Demo Video Link
https://youtu.be/vh0iNZGTuhs

Team Members
Developer & Project Lead: Hloni - Full-stack development, blockchain integration, and system architecture

Future Improvements
Short-term Goals
Mobile App: Native iOS and Android applications

- **Advanced Search**: Filtering by skills, location, and price range
- **Rating System**: User reviews and reputation scoring
- **Dispute Resolution**: Automated mediation system for conflicts
- **Multi-currency Support**: Support for additional Stellar assets

### Long-term Vision

- **AI Matching**: Machine learning for job-worker matching
- **Skill Verification**: Blockchain-based credential system
- **Cross-border Payments**: Integration with traditional payment systems
- **Governance Token**: Community-driven platform governance
- **Enterprise Features**: Business accounts and bulk hiring
- **Educational Platform**: Skills training and certification
- **Real-time Chat System**: Secure messaging platform for workers and clients to discuss project details, negotiate prices, and agree on service terms before initiating escrow contracts

### Technical Enhancements

- **Smart Contract Upgrades**: More sophisticated escrow logic
- **Performance Optimization**: Faster loading and transaction processing
- **Security Audits**: Professional smart contract security reviews
- **Mainnet Deployment**: Production-ready mainnet version
- **API Documentation**: Comprehensive developer documentation

## Contributing

We welcome contributions from the community! Please feel free to:

- **Report bugs and issues**
- **Suggest new features**
- **Submit pull requests**
- **Improve documentation**

License
This project is open-source and available under the MIT License.

SkillLink Africa - Connecting Africa's talent with blockchain-powered security
