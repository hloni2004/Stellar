import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom'
import { StellarWalletsKit, WalletNetwork, FreighterModule } from '@creit.tech/stellar-wallets-kit'
import { Horizon } from '@stellar/stellar-sdk'
import { AuthProvider, useAuth } from './context/AuthContext'
import WalletConnect from './components/WalletConnect'
import Home from './pages/Home'
import MyJobs from './pages/MyJobs'
import Auth from './pages/Auth'
import { AppProvider } from './context/AppContext'
import TransactionHistory from './components/TransactionHistory'

// Initialize wallet kit
const kit = new StellarWalletsKit({
  network: WalletNetwork.TESTNET,
  modules: [new FreighterModule()]
})

// Initialize Stellar testnet server
const server = new Horizon.Server('https://horizon-testnet.stellar.org')

function AppContent() {
  const { user, loading, logout } = useAuth()
  const [publicKey, setPublicKey] = useState(null)
  const [balance, setBalance] = useState('0')
  const [sorobanSupported, setSorobanSupported] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  // Periodic balance update when wallet is connected
  useEffect(() => {
    let intervalId
    if (publicKey) {
      // Update balance every 30 seconds when wallet is connected
      intervalId = setInterval(() => {
        updateBalance(publicKey).catch(console.error)
      }, 30000)
    }
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [publicKey])

  const updateBalance = async (address, retryCount = 0, maxRetries = 3) => {
    try {
      console.log(`Updating balance for ${address.slice(0, 8)}... (attempt ${retryCount + 1})`)
      
      // Add a small delay to allow network to process the transaction
      if (retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000 * retryCount))
      }
      
      const account = await server.loadAccount(address)
      const xlmBalance = account.balances.find(b => b.asset_type === 'native')
      const newBalance = xlmBalance.balance
      
      console.log(`Balance updated: ${newBalance} XLM`)
      setBalance(newBalance)
      
      return newBalance
    } catch (error) {
      console.error('Error fetching balance:', error)
      
      if (error.name === 'NotFoundError') {
        // Account doesn't exist on testnet
        setBalance('0')
        alert(`⚠️ Account Not Found\n\nYour wallet account (${address.slice(0, 8)}...) doesn't exist on the Stellar testnet.\n\nTo fix this:\n1. Go to: https://friendbot.stellar.org\n2. Enter your public key: ${address}\n3. Click "Get lumens" to fund your account\n\nOr visit Stellar Laboratory to create the account.`)
      } else if (retryCount < maxRetries) {
        // Retry on other errors (network issues, etc.)
        console.log(`Retrying balance update in ${2 * (retryCount + 1)} seconds...`)
        return updateBalance(address, retryCount + 1, maxRetries)
      } else {
        console.error('Failed to update balance after max retries')
        setBalance('0')
      }
    }
  }

  const detectSorobanSupport = async () => {
    try {
      // Try to query kit capabilities if available
      if (kit && typeof kit.getCapabilities === 'function') {
        const caps = await kit.getCapabilities()
        if (caps && caps.features && caps.features.includes && caps.features.includes('soroban')) {
          setSorobanSupported(true)
          return true
        }
      }
      // Fallback: detect Freighter's global API
      if (typeof window !== 'undefined' && window.freighterApi && Array.isArray(window.freighterApi && window.freighterApi.features)) {
        if (window.freighterApi.features.includes('soroban')) {
          setSorobanSupported(true)
          return true
        }
      }
    } catch (err) {
      // ignore
    }
    setSorobanSupported(false)
    return false
  }

  // Show loading spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="bg-white rounded-lg p-6 shadow-lg border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Loading SkillLink Africa</h3>
            <p className="text-slate-600">Please wait while we prepare your workspace...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show auth pages if not logged in
  if (!user) {
    return <Auth />
  }

  // Show main app if logged in
  return (
  <AppProvider value={{ kit, server, publicKey, setPublicKey, balance, setBalance, updateBalance, user, sorobanSupported, detectSorobanSupport }}>
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <header className="bg-white shadow-lg border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">S</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                      SkillLink Africa
                    </h1>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Testnet</span>
                  </div>
                </div>
              </div>
              
              {/* Navigation */}
              <nav className="hidden md:flex space-x-4">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                    }`
                  }
                >
                  Browse Jobs
                </NavLink>
                <NavLink
                  to="/my-jobs"
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                    }`
                  }
                >
                  My Jobs
                </NavLink>
              </nav>
              
              <div className="flex items-center space-x-6">
                <div className="text-sm text-slate-700">
                  Welcome, <span className="font-semibold text-slate-800">{user.full_name || user.email}</span>
                </div>
                {publicKey && (
                  <div className="text-sm">
                    <span className="text-slate-500">Balance:</span>
                    <span className="font-bold text-slate-800 ml-1">{balance} XLM</span>
                  </div>
                )}
                <WalletConnect />
                <button
                  onClick={() => setShowHistory(true)}
                  className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 font-medium"
                >
                  Transactions
                </button>
                <button
                  onClick={() => {
                    // clear auth user and wallet state
                    logout()
                    setPublicKey(null)
                    setBalance('0')
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-200 hover:border-slate-300 transition-all duration-200 font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="pb-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/my-jobs" element={<MyJobs />} />
          </Routes>
        </main>
        {showHistory && (
          <TransactionHistory onClose={() => setShowHistory(false)} />
        )}
      </div>
    </Router>
    </AppProvider>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App