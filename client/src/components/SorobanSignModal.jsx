import React from 'react'

const SorobanSignModal = ({ open, step, message, error, onCancel, onRetry, onFallback }) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-lg">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-medium">Soroban Transaction</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="mt-4">
          <div className="mb-3 text-sm text-gray-700">{message}</div>

          {step === 'preparing' && (
            <div className="flex items-center space-x-3">
              <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
              <div className="text-sm text-gray-600">Preparing transaction for simulation...</div>
            </div>
          )}

          {step === 'awaiting_signature' && (
            <div className="flex items-center space-x-3">
              <div className="h-5 w-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-pulse"></div>
              <div className="text-sm text-gray-600">Waiting for your wallet to sign the transaction...</div>
            </div>
          )}

          {step === 'submitting' && (
            <div className="flex items-center space-x-3">
              <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
              <div className="text-sm text-gray-600">Submitting to Soroban network...</div>
            </div>
          )}

          {step === 'no_wallet_support' && (
            <div>
              <p className="text-sm text-yellow-700">Your connected wallet doesn't support Soroban signing.</p>
              <div className="mt-4 flex space-x-2">
                <button onClick={onFallback} className="px-4 py-2 bg-green-600 text-white rounded">Fallback to account escrow</button>
                <button onClick={onCancel} className="px-4 py-2 bg-gray-100 rounded">Cancel</button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-green-700">Transaction successful! The job has been created.</div>
          )}

          {step === 'error' && (
            <div>
              <div className="text-red-700 mb-2">An error occurred: {error?.message || 'Unknown error'}</div>
              <div className="flex space-x-2">
                <button onClick={onRetry} className="px-4 py-2 bg-blue-600 text-white rounded">Retry</button>
                <button onClick={onCancel} className="px-4 py-2 bg-gray-100 rounded">Close</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SorobanSignModal
