#!/bin/bash
# 🚀 Quick Setup Script for SkillLink Africa

echo "🚀 Setting up SkillLink Africa Dual Approval System..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first:"
    echo "   https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install server dependencies"
    exit 1
fi

# Install client dependencies
echo "📦 Installing client dependencies..."
cd ../client
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install client dependencies"
    exit 1
fi

cd ..

echo ""
echo "✅ Dependencies installed successfully!"
echo ""
echo "🔧 Next steps:"
echo "1. Create server/.env file (use server/.env.template as guide)"
echo "2. Set up Supabase database (see SETUP_GUIDE.md)"
echo "3. Generate and fund escrow account"
echo "4. Start server: cd server && npm start"
echo "5. Start client: cd client && npm run dev"
echo ""
echo "📖 Read SETUP_GUIDE.md for detailed instructions"