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
        <div className="flex flex-col">
          <span className="text-sm text-gray-600">
            {publicKey.slice(0, 8)}...{publicKey.slice(-8)}
          </span>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Connected</span>
            {sorobanSupported ? (
              <span className="text-xs text-white bg-indigo-600 px-2 py-1 rounded">Soroban-ready</span>
            ) : (
              <span className="text-xs text-yellow-800 bg-yellow-100 px-2 py-1 rounded">No Soroban</span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
    >
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  )
}

export default WalletConnect