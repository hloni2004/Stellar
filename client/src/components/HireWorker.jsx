import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { TransactionBuilder, Operation, Asset, Networks } from '@stellar/stellar-sdk'
import { submitSignedXDRToRPC } from '../utils/soroban'
import SorobanSignModal from './SorobanSignModal'

const HireWorker = ({ job, onClose }) => {
  const { kit, server, publicKey, updateBalance, sorobanSupported } = useApp()
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState('')
  const [sorobanModal, setSorobanModal] = useState({ open: false, step: null, message: '', error: null })

  const handleHire = async () => {
    if (!publicKey) {
      alert('Please connect your wallet first')
      return
    }

    setIsProcessing(true)
    setStatus('Initiating payment...')

    try {
      // Step 1: Load client account
      const account = await server.loadAccount(publicKey)
      setStatus('Creating transaction...')

      // Step 2: Get escrow configuration from backend (supports legacy account escrow or Soroban contract)
      setStatus('Fetching escrow configuration...')
      const escRes = await fetch('/api/escrow/info')
      if (!escRes.ok) {
        const errBody = await escRes.json().catch(() => ({}))
        throw new Error(errBody.error || 'Failed to get escrow configuration')
      }
      const info = await escRes.json()
      // If Soroban contract is configured, use server-prepare flow
      if (info.soroban_contract) {
        // Open modal and show preparing state
        setSorobanModal({ open: true, step: 'preparing', message: 'Preparing transaction for Soroban escrow...' })
        // Ask server to prepare an unsigned Soroban tx
        const prepRes = await fetch('/api/soroban-escrow/prepare-create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ client: publicKey, worker: job.worker_public_key, amount: job.price, job_id: job.id })
        })
        if (!prepRes.ok) {
          const err = await prepRes.json().catch(() => ({}))
          throw new Error(err.error || 'Failed to prepare soroban tx')
        }
        const { unsigned_xdr, fee, network, contract } = await prepRes.json()

        // if wallet doesn't support soroban, show modal state and let user pick fallback
        if (!sorobanSupported) {
          setSorobanModal({ open: true, step: 'no_wallet_support', message: 'Your wallet does not support Soroban signing.' })
          // Wait for user action via modal handlers (we'll throw to break the try block and let modal control)
          throw new Error('No soroban support')
        }

        setSorobanModal({ open: true, step: 'awaiting_signature', message: 'Please sign the transaction in your wallet.' })

        // Use StellarWalletsKit (Freighter) to sign the XDR. kit.signTransaction for Soroban-supporting wallets
        const { signedTxXdr } = await kit.signTransaction(unsigned_xdr, {
          address: publicKey,
          networkPassphrase: Networks.TESTNET,
          soroban: true
        })

        setSorobanModal({ open: true, step: 'submitting', message: 'Submitting to network...' })

        // Submit signed XDR to Soroban RPC
        const rpcResult = await submitSignedXDRToRPC(signedTxXdr, info.soroban_rpc || 'https://soroban-testnet.stellar.org')

        // Notify backend to record payment and persist mapping
        const recordRes = await fetch('/api/soroban-escrow/submit-signed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ signed_xdr: signedTxXdr, job_id: job.id, client: publicKey, worker: job.worker_public_key, amount: job.price })
        })
        if (!recordRes.ok) {
          const err = await recordRes.json().catch(() => ({}))
          throw new Error(err.error || 'Failed to record soroban payment')
        }

        setSorobanModal({ open: true, step: 'success', message: 'Transaction confirmed' })
        setStatus('Payment successful via Soroban escrow! Job created.')
        
        // Wait a bit for the network to process the transaction, then update balance
        setTimeout(async () => {
          try {
            await updateBalance(publicKey)
          } catch (err) {
            console.warn('Failed to update balance after Soroban transaction:', err)
          }
        }, 3000)
        
        setTimeout(() => onClose(), 2000)
        return
      }

      const { escrow } = info

      // Build payment transaction to escrow
      const transaction = new TransactionBuilder(account, {
        fee: await server.fetchBaseFee(),
        networkPassphrase: Networks.TESTNET,
      })
      .addOperation(
        Operation.payment({
          destination: escrow,
          asset: Asset.native(),
          amount: job.price.toString(),
        })
      )
      .setTimeout(30)
      .build()

      setStatus('Please sign transaction in your wallet...')

      // Step 3: Sign with wallet
      const { signedTxXdr } = await kit.signTransaction(transaction.toXDR(), {
        address: publicKey,
        networkPassphrase: Networks.TESTNET,
      })

      setStatus('Submitting transaction...')

      // Step 4: Submit to network
      const signedTransaction = TransactionBuilder.fromXDR(signedTxXdr, Networks.TESTNET)
      const result = await server.submitTransaction(signedTransaction)

      setStatus('Creating job contract...')

      // Step 5: Record transaction in backend (status: escrow)
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: job.id,
          client_public_key: publicKey,
          worker_public_key: job.worker_public_key,
          amount: job.price,
          transaction_hash: result.hash,
          status: 'escrow'
        }),
      })

      if (!response.ok) throw new Error('Failed to record payment')

      setStatus('Payment successful! Job created.')
      
      // Wait a bit for the network to process the transaction, then update balance
      setTimeout(async () => {
        try {
          await updateBalance(publicKey)
        } catch (err) {
          console.warn('Failed to update balance after payment transaction:', err)
        }
      }, 3000)
      
      setTimeout(() => {
        onClose()
      }, 2000)

    } catch (error) {
      console.error('Hire failed:', error)
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
      
      if (error.name === 'NotFoundError') {
        setStatus(`❌ Account not found on testnet. Please fund your wallet account first.`)
        alert(`⚠️ Wallet Account Not Found\n\nYour wallet account doesn't exist on the Stellar testnet.\n\nTo fix this:\n1. Go to: https://friendbot.stellar.org\n2. Enter your public key\n3. Click "Get lumens" to fund your account with 10,000 XLM\n\nThen try hiring again.`)
      } else {
        // Show error in modal if soroban modal open
        if (sorobanModal.open) {
          setSorobanModal({ ...sorobanModal, step: 'error', error })
        }
        setStatus(`Payment failed: ${error.message || 'Unknown error'}. Check console for details.`)
      }
    } finally {
      setIsProcessing(false)
    }
  }

    const closeSorobanModal = () => {
      setSorobanModal({ open: false, step: null, message: '', error: null })
    }

    const retrySoroban = () => {
      closeSorobanModal()
      // retry the flow
      handleHire()
    }

    const fallbackToAccountEscrow = async () => {
      try {
        setSorobanModal({ open: false, step: null, message: '', error: null })
        setStatus('Attempting fallback to account escrow...')
        const eRes = await fetch('/api/escrow/address')
        if (!eRes.ok) throw new Error('No account-based escrow available')
        const { escrow } = await eRes.json()
        const transaction2 = new TransactionBuilder(account, {
          fee: await server.fetchBaseFee(),
          networkPassphrase: Networks.TESTNET,
        })
        .addOperation(
          Operation.payment({
            destination: escrow,
            asset: Asset.native(),
            amount: job.price.toString(),
          })
        )
        .setTimeout(30)
        .build()

        setStatus('Please sign fallback transaction in your wallet...')
        const { signedTxXdr: signedFallback } = await kit.signTransaction(transaction2.toXDR(), { address: publicKey, networkPassphrase: Networks.TESTNET })
        const signedTransaction = TransactionBuilder.fromXDR(signedFallback, Networks.TESTNET)
        const result = await server.submitTransaction(signedTransaction)

        // record payment as legacy escrow
        const response = await fetch('/api/payments/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job_id: job.id, client_public_key: publicKey, worker_public_key: job.worker_public_key, amount: job.price, transaction_hash: result.hash, status: 'escrow' })
        })
        if (!response.ok) throw new Error('Failed to record payment (fallback)')

        setStatus('Payment successful (fallback escrow). Job created.')
        
        // Wait a bit for the network to process the transaction, then update balance
        setTimeout(async () => {
          try {
            await updateBalance(publicKey)
          } catch (err) {
            console.warn('Failed to update balance after fallback transaction:', err)
          }
        }, 3000)
        
        setTimeout(() => onClose(), 2000)
      } catch (err) {
        console.error('Fallback failed:', err)
        setStatus('Fallback failed. Check console for details.')
      }
    }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
          <h2 className="text-xl font-bold">Hire Worker</h2>
          <p className="text-blue-100 text-sm mt-1">Secure payment via blockchain escrow</p>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="space-y-4 mb-6">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-medium text-slate-600">Job Title</span>
              </div>
              <p className="font-semibold text-slate-800">{job.title}</p>
            </div>
            
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-medium text-slate-600">Worker</span>
              </div>
              <p className="font-mono text-sm text-slate-700 bg-white px-3 py-2 rounded border">
                {job.worker_public_key.slice(0, 20)}...
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-600">Payment Amount</span>
                <div className="text-right">
                  <span className="text-2xl font-bold text-slate-800">{job.price}</span>
                  <span className="text-sm font-medium text-slate-600 ml-1">XLM</span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 text-blue-600 mt-0.5">
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800">Escrow Protection</p>
                  <p className="text-xs text-blue-600 mt-1">
                    Funds will be held securely until job completion and your approval.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {status && (
            <div className={`p-4 rounded-lg mb-6 border ${
              status.includes('failed') || status.includes('❌') 
                ? 'bg-red-50 text-red-800 border-red-200' 
                : status.includes('successful') || status.includes('confirmed')
                ? 'bg-green-50 text-green-800 border-green-200'
                : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}>
              <div className="flex items-center space-x-2">
                {status.includes('failed') || status.includes('❌') ? (
                  <div className="w-4 h-4 text-red-600">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : status.includes('successful') || status.includes('confirmed') ? (
                  <div className="w-4 h-4 text-green-600">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                )}
                <span className="text-sm font-medium">{status}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-6 py-2.5 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleHire}
              disabled={isProcessing}
              className="px-8 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>Confirm Hire</span>
                </>
              )}
            </button>
          </div>
        </div>
        
        <SorobanSignModal
          open={sorobanModal.open}
          step={sorobanModal.step}
          message={sorobanModal.message}
          error={sorobanModal.error}
          onCancel={closeSorobanModal}
          onRetry={retrySoroban}
          onFallback={fallbackToAccountEscrow}
        />
      </div>
    </div>
  )
}

export default HireWorker