import { useState } from 'react'
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

  const updateBalance = async (address) => {
    try {
      const account = await server.loadAccount(address)
      const xlmBalance = account.balances.find(b => b.asset_type === 'native')
      setBalance(xlmBalance.balance)
    } catch (error) {
      console.error('Error fetching balance:', error)
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading SkillLink Africa...</p>
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
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-blue-600">SkillLink Africa</h1>
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Testnet</span>
              </div>
              
              {/* Navigation */}
              <nav className="hidden md:flex space-x-8">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  Browse Jobs
                </NavLink>
                <NavLink
                  to="/my-jobs"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  My Jobs
                </NavLink>
              </nav>
              
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  Welcome, <span className="font-semibold">{user.full_name || user.email}</span>
                </div>
                {publicKey && (
                  <div className="text-sm text-gray-600">
                    Balance: <span className="font-semibold">{balance} XLM</span>
                  </div>
                )}
                <WalletConnect />
                <button
                  onClick={() => setShowHistory(true)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <main>
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