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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onBackdropClick}>
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 relative">
        <button
          aria-label="Close transactions"
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
        >
          <span className="text-gray-700 font-bold">×</span>
        </button>

        <div className="mb-4">
          <h2 className="text-xl font-bold">Transaction History</h2>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No transactions found.</div>
        ) : (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {transactions.map(tx => (
              <div key={tx.id} className="border rounded p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold">Job: {tx.jobs?.title || tx.job_id}</div>
                    <div className="text-sm text-gray-600">Category: {tx.jobs?.category || '—'}</div>
                    <div className="text-sm text-gray-600">From: {tx.client_public_key}</div>
                    <div className="text-sm text-gray-600">To: {tx.worker_public_key || tx.jobs?.worker_public_key}</div>
                    <div className="text-sm text-gray-600 mt-2">Hash: <a href={`https://horizon-testnet.stellar.org/transactions/${tx.transaction_hash}`} target="_blank" rel="noreferrer" className="text-blue-600">{tx.transaction_hash}</a></div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="font-bold text-green-600">{tx.amount} XLM</div>
                    <div className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleString()}</div>
                    <div className="text-sm mt-2 text-gray-700">Status: {tx.status}</div>
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
