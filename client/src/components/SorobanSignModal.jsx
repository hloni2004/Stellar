import React from 'react'

const SorobanSignModal = ({ open, step, message, error, onCancel, onRetry, onFallback }) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-paper border-strict max-w-lg w-full">
        <div className="flex items-start justify-between border-b-strict px-5 py-4">
          <h3 className="font-sans font-black uppercase tracking-tighter leading-tight text-lg">Soroban Transaction</h3>
          <button onClick={onCancel} className="border-strict px-2 py-1 font-bold text-xs hover:bg-paperHover">X</button>
        </div>

        <div className="px-5 py-4">
          <div className="mb-3 font-sans text-gray-800 leading-relaxed text-sm">{message}</div>

          {step === 'preparing' && (
            <div className="font-mono text-xs uppercase">Preparing transaction for simulation...</div>
          )}

          {step === 'awaiting_signature' && (
            <div className="font-mono text-xs uppercase">Waiting for wallet signature...</div>
          )}

          {step === 'submitting' && (
            <div className="font-mono text-xs uppercase">Submitting to Soroban network...</div>
          )}

          {step === 'no_wallet_support' && (
            <div>
              <p className="font-sans text-gray-800 leading-relaxed text-sm">Your connected wallet does not support Soroban signing.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={onFallback} className="bg-ink text-paper hover:bg-safety px-4 py-2 font-bold uppercase text-xs tracking-wide transition-colors">Fallback to account escrow</button>
                <button onClick={onCancel} className="bg-transparent text-ink border-strict hover:bg-ink hover:text-paper px-4 py-2 font-bold uppercase text-xs tracking-wide transition-colors">Cancel</button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="font-sans text-gray-800 leading-relaxed text-sm">Transaction successful. The job has been created.</div>
          )}

          {step === 'error' && (
            <div>
              <div className="font-sans text-gray-800 leading-relaxed text-sm mb-2">An error occurred: {error?.message || 'Unknown error'}</div>
              <div className="flex flex-wrap gap-2">
                <button onClick={onRetry} className="bg-ink text-paper hover:bg-safety px-4 py-2 font-bold uppercase text-xs tracking-wide transition-colors">Retry</button>
                <button onClick={onCancel} className="bg-transparent text-ink border-strict hover:bg-ink hover:text-paper px-4 py-2 font-bold uppercase text-xs tracking-wide transition-colors">Close</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SorobanSignModal
