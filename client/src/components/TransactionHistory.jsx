import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'

const TransactionHistory = ({ onClose }) => {
  const { publicKey } = useApp()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState([])

  useEffect(() => {
    const fetchHistory = async () => {
      if (!publicKey) return
      setLoading(true)
      try {
        const res = await fetch(`/api/payments/history?publicKey=${encodeURIComponent(publicKey)}`)
        if (!res.ok) throw new Error('Failed to load history')
        const data = await res.json()
        setTransactions(data)
      } catch (err) {
        console.error('Error loading transactions:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [publicKey])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const onBackdropClick = (e) => {
    // only close if clicking the backdrop (not the modal content)
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onBackdropClick}>
      <div className="bg-paper border-strict max-w-3xl w-full relative">
        <button
          aria-label="Close transactions"
          onClick={onClose}
          className="absolute top-2 right-2 border-strict px-2 py-1 font-bold text-xs hover:bg-paperHover"
        >
          <span className="text-ink font-bold">X</span>
        </button>

        <div className="border-b-strict px-5 py-4">
          <h2 className="font-sans font-black uppercase tracking-tighter leading-tight text-xl">Transaction History</h2>
        </div>

        {loading ? (
          <div className="px-5 py-8 font-mono text-sm">Loading ledger entries...</div>
        ) : transactions.length === 0 ? (
          <div className="px-5 py-8 font-sans text-gray-800 leading-relaxed">No transactions found.</div>
        ) : (
          <div className="max-h-[70vh] overflow-y-auto">
            {transactions.map(tx => (
              <div key={tx.id} className="border-b-strict p-4">
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <div className="flex-1">
                    <div className="font-sans font-black uppercase tracking-tight text-sm">{tx.jobs?.title || tx.job_id}</div>
                    <div className="font-mono text-xs mt-1">Category: {tx.jobs?.category || 'N/A'}</div>
                    <div className="font-mono text-xs mt-1">From: {tx.client_public_key}</div>
                    <div className="font-mono text-xs mt-1">To: {tx.worker_public_key || tx.jobs?.worker_public_key}</div>
                    <div className="font-mono text-xs mt-2 break-all">Hash: <a href={`https://horizon-testnet.stellar.org/transactions/${tx.transaction_hash}`} target="_blank" rel="noreferrer" className="underline">{tx.transaction_hash}</a></div>
                  </div>
                  <div className="text-left md:text-right">
                    <div className="font-mono text-lg font-bold">{tx.amount} XLM</div>
                    <div className="font-mono text-xs">{new Date(tx.created_at).toLocaleString()}</div>
                    <div className="font-mono text-xs uppercase mt-1">Status: {tx.status}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TransactionHistory
