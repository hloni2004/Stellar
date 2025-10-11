import { useState } from 'react'
import { useApp } from '../context/AppContext'

const WalletConnect = () => {
  const { kit, publicKey, setPublicKey, updateBalance, sorobanSupported, detectSorobanSupport } = useApp()
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      await kit.setWallet('freighter')
      const { address } = await kit.getAddress()
      setPublicKey(address)
      await updateBalance(address)
      // detect soroban support on wallet after connect
      if (typeof detectSorobanSupport === 'function') {
        detectSorobanSupport()
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      alert('Failed to connect wallet. Make sure Freighter is installed and set to Testnet.')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = () => {
    setPublicKey(null)
  }

  if (publicKey) {
    return (
      <div className="flex items-center space-x-4">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg px-4 py-2">
          <div className="flex items-center space-x-3">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-700">
                {publicKey.slice(0, 8)}...{publicKey.slice(-8)}
              </span>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full font-medium flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></div>
                  Connected
                </span>
                {sorobanSupported ? (
                  <span className="text-xs text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full font-medium">
                    Soroban Ready
                  </span>
                ) : (
                  <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-medium">
                    Legacy Mode
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center space-x-2"
    >
      {isConnecting ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>Connecting...</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          <span>Connect Wallet</span>
        </>
      )}
    </button>
  )
}

export default WalletConnect