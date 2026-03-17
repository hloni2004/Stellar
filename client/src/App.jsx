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
      <div className="min-h-screen bg-paper text-ink flex items-center justify-center p-6">
        <div className="w-full max-w-xl border-strict bg-paper">
          <div className="border-b-strict px-6 py-3">
            <h3 className="font-sans font-black uppercase tracking-tighter leading-tight text-xl">Loading SkillLink Africa</h3>
          </div>
          <div className="px-6 py-4 font-mono text-sm">Initializing secure ledger workspace...</div>
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
      <div className="min-h-screen bg-paper text-ink">
        <header className="border-b-strict bg-paper">
          <div className="w-full px-4 lg:px-6 py-4">
            <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[auto_1fr_auto] xl:items-center xl:gap-6">
              <div className="grid gap-1 min-w-0">
                <h1 className="font-sans font-black uppercase tracking-tighter leading-tight text-2xl">SkillLink Africa</h1>
                <div className="font-mono text-xs uppercase">Network: TESTNET</div>
              </div>

              <nav className="flex flex-wrap gap-2 xl:justify-center">
                  <NavLink
                    to="/"
                    className={({ isActive }) =>
                      `px-4 py-2 border-strict font-bold uppercase text-xs tracking-wide transition-colors ${
                        isActive
                          ? 'bg-ink text-paper'
                          : 'bg-transparent text-ink hover:bg-paperHover'
                      }`
                    }
                  >
                    Browse Jobs
                  </NavLink>
                  <NavLink
                    to="/my-jobs"
                    className={({ isActive }) =>
                      `px-4 py-2 border-strict font-bold uppercase text-xs tracking-wide transition-colors ${
                        isActive
                          ? 'bg-ink text-paper'
                          : 'bg-transparent text-ink hover:bg-paperHover'
                      }`
                    }
                  >
                    My Jobs
                  </NavLink>
              </nav>

              <div className="grid gap-2 xl:justify-items-end">
                <div className="font-sans text-sm leading-relaxed xl:text-right break-words">
                  Operator: <span className="font-black uppercase tracking-tight">{user.full_name || user.email}</span>
                </div>
                {publicKey && (
                  <div className="font-mono text-sm xl:text-right">
                    Balance: <span className="font-bold">{balance} XLM</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 xl:justify-end">
                  <WalletConnect />
                  <button
                    onClick={() => setShowHistory(true)}
                    className="bg-transparent text-ink border-strict hover:bg-ink hover:text-paper px-4 py-2 font-bold uppercase text-xs tracking-wide transition-colors"
                  >
                    Transactions
                  </button>
                  <button
                    onClick={() => {
                      logout()
                      setPublicKey(null)
                      setBalance('0')
                    }}
                    className="bg-ink text-paper hover:bg-safety px-4 py-2 font-bold uppercase text-xs tracking-wide transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="pb-8 border-t-strict">
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