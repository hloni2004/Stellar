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

  if (publicKey) {
    return (
      <div className="border-strict px-4 py-2 bg-paper">
        <div className="font-mono text-xs">{publicKey.slice(0, 8)}...{publicKey.slice(-8)}</div>
        <div className="flex items-center gap-3 mt-1 font-mono text-xs uppercase">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-soroban rounded-full"></span>
            Connected
          </span>
          <span>{sorobanSupported ? 'Soroban Ready' : 'Legacy Mode'}</span>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className="bg-ink text-paper hover:bg-safety px-6 py-2 font-bold uppercase text-xs tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isConnecting ? (
        <span>Connecting...</span>
      ) : (
        <span>Connect Wallet</span>
      )}
    </button>
  )
}

export default WalletConnect