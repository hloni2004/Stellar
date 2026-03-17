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
        const account = await server.loadAccount(publicKey)
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-paper border-strict max-w-md w-full">
        {/* Header */}
        <div className="border-b-strict p-5">
          <h2 className="font-sans font-black uppercase tracking-tighter leading-tight text-xl">Hire Worker</h2>
          <p className="font-sans text-gray-800 leading-relaxed text-sm mt-1">Secure payment via blockchain escrow.</p>
        </div>
        
        {/* Content */}
        <div className="p-5">
          <div className="space-y-4 mb-6">
            <div className="border-strict p-3">
              <div className="flex justify-between items-start mb-3">
                <span className="font-mono text-xs uppercase">Job Title</span>
              </div>
              <p className="font-sans font-black uppercase tracking-tight text-sm">{job.title}</p>
            </div>
            
            <div className="border-strict p-3">
              <div className="flex justify-between items-start mb-3">
                <span className="font-mono text-xs uppercase">Worker</span>
              </div>
              <p className="font-mono text-sm break-all">
                {job.worker_public_key.slice(0, 20)}...
              </p>
            </div>
            
            <div className="border-strict p-3">
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs uppercase">Payment Amount</span>
                <div className="text-right">
                  <span className="font-mono text-2xl font-bold">{job.price}</span>
                  <span className="font-mono text-sm ml-1">XLM</span>
                </div>
              </div>
            </div>
            
            <div className="border-strict p-3">
              <p className="font-sans font-black uppercase tracking-tight text-sm">Escrow Protection</p>
              <p className="font-sans text-gray-800 leading-relaxed text-xs mt-1">Funds remain locked until job completion and your approval.</p>
            </div>
          </div>

          {status && (
            <div className={`p-4 mb-6 border-strict ${
              status.includes('failed') || status.includes('❌') 
                ? 'bg-paper text-ink' 
                : status.includes('successful') || status.includes('confirmed')
                ? 'bg-paper text-ink'
                : 'bg-paper text-ink'
            }`}>
              <span className="font-mono text-xs uppercase">{status}</span>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="bg-transparent text-ink border-strict hover:bg-ink hover:text-paper px-6 py-2 font-bold uppercase text-xs tracking-wide transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleHire}
              disabled={isProcessing}
              className="bg-ink text-paper hover:bg-safety px-8 py-2 font-bold uppercase text-xs tracking-wide transition-colors disabled:opacity-50"
            >
              {isProcessing ? 'Processing...' : 'Confirm Hire'}
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