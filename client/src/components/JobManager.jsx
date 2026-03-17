import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'

const JobManager = ({ job, onJobUpdate }) => {
  const { publicKey } = useApp()
  const [loading, setLoading] = useState(false)
  const [completionNotes, setCompletionNotes] = useState('')
  const [paymentStatus, setPaymentStatus] = useState(null)

  // Check if current user is the worker
  const isWorker = publicKey === job.worker_public_key
  // Check if current user is the employer (use employer_public_key if available, fallback to payment data)
  const isEmployer = (job.employer_public_key && publicKey === job.employer_public_key) ||
                     (paymentStatus && paymentStatus.payment_status !== 'not_paid' && 
                      publicKey && paymentStatus.client_public_key === publicKey)

  useEffect(() => {
    fetchPaymentStatus()
  }, [job.id])

  const fetchPaymentStatus = async () => {
    try {
      const response = await fetch(`/api/payments/job/${job.id}/status`)
      if (response.ok) {
        const data = await response.json()
        setPaymentStatus(data)
      }
    } catch (error) {
      console.error('Failed to fetch payment status:', error)
    }
  }

  const handleStartJob = async () => {
    if (!isWorker) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/jobs/${job.id}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          worker_public_key: publicKey
        })
      })

      if (response.ok) {
        const result = await response.json()
        onJobUpdate(result.job)
        alert('Job started! You can now begin working.')
      } else {
        const error = await response.json()
        alert(`Failed to start job: ${error.error}`)
      }
    } catch (error) {
      console.error('Error starting job:', error)
      alert('Failed to start job')
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteJob = async () => {
    if (!isWorker) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/jobs/${job.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          worker_public_key: publicKey,
          completion_notes: completionNotes
        })
      })

      if (response.ok) {
        const result = await response.json()
        onJobUpdate(result.job)
        alert('Work completed! Waiting for employer to confirm they received the service.')
      } else {
        const error = await response.json()
        alert(`Failed to complete job: ${error.error}`)
      }
    } catch (error) {
      console.error('Error completing job:', error)
      alert('Failed to complete job')
    } finally {
      setLoading(false)
    }
  }

  const handleEmployerApproval = async () => {
    if (!isEmployer) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/jobs/${job.id}/employer-approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employer_public_key: publicKey
        })
      })

      if (response.ok) {
        const result = await response.json()
        onJobUpdate(result.job)
        if (result.payment_released) {
          alert(`Service confirmed! Payment has been released to the worker.`)
        } else {
          alert(`Service receipt confirmed! Payment will be released once worker completes the job.`)
        }
        fetchPaymentStatus() // Refresh payment status
      } else {
        const error = await response.json()
        alert(`Failed to confirm service: ${error.error}`)
      }
    } catch (error) {
      console.error('Error confirming service:', error)
      alert('Failed to confirm service receipt')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-paper text-ink'
      case 'paid': return 'bg-paper text-ink'
      case 'in_progress': return 'bg-paper text-ink'
      case 'completed': return 'bg-paper text-ink'
      case 'approved': return 'bg-paper text-ink'
      default: return 'bg-paper text-ink'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'open': return 'Open'
      case 'paid': return 'Paid - Ready to Start'
      case 'in_progress': return 'In Progress'
      case 'completed': return 'Completed - Awaiting Employer Approval'
      case 'approved': return 'Both Parties Approved & Paid'
      default: return status
    }
  }

  const getApprovalStatus = (job) => {
    if (job.status === 'approved') {
      return 'Both parties approved - Payment released'
    }
    if (job.status === 'completed') {
      const workerApproved = job.worker_approved || false
      const employerApproved = job.employer_approved || false
      
      if (workerApproved && employerApproved) {
        return 'Both approved - Processing payment release'
      } else if (workerApproved && !employerApproved) {
        return 'Worker completed - Waiting for employer approval'
      } else if (!workerApproved && employerApproved) {
        return 'Employer approved - Waiting for worker completion'
      } else {
        return 'Waiting for both approvals'
      }
    }
    return null
  }

  return (
    <div className="bg-paper border-b-strict p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-sans font-black uppercase tracking-tighter leading-tight text-xl">{job.title}</h3>
        <span className={`px-3 py-1 text-xs font-mono uppercase border-strict ${getStatusColor(job.status)}`}>
          {getStatusText(job.status)}
        </span>
      </div>
      
      <p className="font-sans text-gray-800 leading-relaxed mb-4">{job.description}</p>
      
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm border-strict p-3">
        <div>
          <span className="font-mono text-xs uppercase">Category:</span> <span className="font-sans text-gray-800">{job.category}</span>
        </div>
        <div>
          <span className="font-mono text-xs uppercase">Location:</span> <span className="font-sans text-gray-800">{job.location}</span>
        </div>
        <div>
          <span className="font-mono text-xs uppercase">Price:</span> 
          <span className="text-lg font-mono font-bold ml-2">{job.price} XLM</span>
        </div>
        <div>
          <span className="font-mono text-xs uppercase">Worker:</span> 
          <span className="font-mono">{job.worker_public_key ? `${job.worker_public_key.slice(0, 8)}...` : 'Not assigned'}</span>
        </div>
        {job.employer_public_key && (
          <div>
            <span className="font-mono text-xs uppercase">Employer:</span> 
            <span className="font-mono">{job.employer_public_key.slice(0, 8)}...</span>
          </div>
        )}
        {job.assigned_at && (
          <div>
            <span className="font-mono text-xs uppercase">Assigned:</span> 
            <span className="font-mono">{new Date(job.assigned_at).toLocaleDateString()}</span>
          </div>
        )}
        {job.completed_at && (
          <div>
            <span className="font-mono text-xs uppercase">Completed:</span> 
            <span className="font-mono">{new Date(job.completed_at).toLocaleDateString()}</span>
          </div>
        )}
        {job.approved_at && (
          <div>
            <span className="font-mono text-xs uppercase">Approved:</span> 
            <span className="font-mono">{new Date(job.approved_at).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Payment Status */}
      {paymentStatus && (
        <div className="mb-4 p-3 border-strict">
          <h4 className="font-sans font-black uppercase tracking-tight text-sm mb-2">Payment Status</h4>
          <div className="font-mono text-xs">
            <div>Status: <span className="font-medium">{paymentStatus.payment_status}</span></div>
            {paymentStatus.amount && (
              <div>Amount: <span className="font-medium">{paymentStatus.amount} XLM</span></div>
            )}
            {paymentStatus.released_at ? (
              <div>Released: <span className="font-medium">{new Date(paymentStatus.released_at).toLocaleString()}</span></div>
            ) : paymentStatus.payment_status === 'paid' ? (
              <div>Status: <span className="font-medium">Payment Released</span></div>
            ) : null}
          </div>
        </div>
      )}

      {/* Dual Approval Status */}
      {(job.status === 'completed' || job.status === 'approved') && (
        <div className="mb-4 p-3 border-strict">
          <h4 className="font-sans font-black uppercase tracking-tight text-sm mb-2">Approval Status</h4>
          <div className="font-mono text-xs">
            <div>
              Worker Approval: 
              <span className="ml-2 font-medium">
                {job.worker_approved ? '✅ Completed' : '⏳ Pending'}
              </span>
            </div>
            <div>
              Employer Approval: 
              <span className="ml-2 font-medium">
                {job.employer_approved ? '✅ Service Confirmed' : '⏳ Pending'}
              </span>
            </div>
            {job.employer_approved_at && (
              <div className="mt-1 text-xs">
                Service confirmed: {new Date(job.employer_approved_at).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Completion Notes Display */}
      {job.completion_notes && (
        <div className="mb-4 p-3 border-strict">
          <h4 className="font-sans font-black uppercase tracking-tight text-sm mb-2">Work Completion Notes</h4>
          <p className="font-sans text-gray-800 leading-relaxed text-sm">{job.completion_notes}</p>
        </div>
      )}

      {/* Worker Actions */}
      {/* Start Job Button - when job is paid and ready to start */}
      {isWorker && job.status === 'paid' && (
        <div className="border-t-strict pt-4">
          <h4 className="font-sans font-black uppercase tracking-tight text-sm mb-3">Start Your Work</h4>
          <p className="font-sans text-gray-800 leading-relaxed text-sm mb-3">
            Payment has been secured in escrow. Click below to start working on this job.
          </p>
          <button
            onClick={handleStartJob}
            disabled={loading}
            className="bg-ink text-paper hover:bg-safety px-4 py-2 font-bold uppercase text-xs tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Starting...' : 'Start Job'}
          </button>
        </div>
      )}

      {/* Complete Job Button - when job is in progress and worker hasn't approved */}
      {isWorker && job.status === 'in_progress' && !job.worker_approved && (
        <div className="border-t-strict pt-4">
          <h4 className="font-sans font-black uppercase tracking-tight text-sm mb-3">Complete & Approve Your Work</h4>
          <p className="font-sans text-gray-800 leading-relaxed text-sm mb-3">
            Mark your work as completed and confirm you have finished the job.
          </p>
          <textarea
            value={completionNotes}
            onChange={(e) => setCompletionNotes(e.target.value)}
            placeholder="Add notes about the completed work (optional)"
            className="bg-transparent border-b-strict border-ink outline-none py-3 font-sans text-sm text-gray-800 leading-relaxed focus:border-safety transition-colors rounded-none w-full resize-none"
            rows="3"
          />
          <button
            onClick={handleCompleteJob}
            disabled={loading}
            className="mt-3 bg-ink text-paper hover:bg-safety px-4 py-2 font-bold uppercase text-xs tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Complete & Approve Work'}
          </button>
        </div>
      )}

      {/* Debug Info - Remove this after testing */}
      {isWorker && (
        <div className="border-t-strict pt-4 border-strict p-3 text-xs font-mono">
          <strong>Debug Info:</strong><br/>
          Status: {job.status}<br/>
          Worker Approved: {job.worker_approved ? 'true' : 'false'}<br/>
          Employer Approved: {job.employer_approved ? 'true' : 'false'}<br/>
          Show Complete Button: {(job.status === 'in_progress' && !job.worker_approved) ? 'YES' : 'NO'}
        </div>
      )}

      {/* Employer Actions */}
      {isEmployer && job.status === 'completed' && job.worker_approved && !job.employer_approved && (
        <div className="border-t-strict pt-4">
          <h4 className="font-sans font-black uppercase tracking-tight text-sm mb-3">Confirm Service Receipt</h4>
          <p className="font-sans text-gray-800 leading-relaxed text-sm mb-3">
            Review the completed work and confirm that you received the service to release payment.
          </p>
          {job.completion_notes && (
            <div className="mb-3 p-3 border-strict">
              <p className="text-xs font-mono uppercase">Worker completion notes:</p>
              <p className="text-sm font-sans text-gray-800 leading-relaxed mt-1">"{job.completion_notes}"</p>
            </div>
          )}
          <button
            onClick={handleEmployerApproval}
            disabled={loading}
            className="bg-ink text-paper hover:bg-safety px-4 py-2 font-bold uppercase text-xs tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Confirming...' : 'Confirm Service & Release Payment'}
          </button>
        </div>
      )}

      {/* Status Messages */}
      {isWorker && job.worker_approved && !job.employer_approved && (
        <div className="border-t-strict pt-4">
          <div className="border-strict p-3">
            <p className="text-sm font-sans text-gray-800 leading-relaxed">
              ✅ You've completed the work! Waiting for employer to confirm they received the service.
            </p>
          </div>
        </div>
      )}

      {isEmployer && !job.worker_approved && (
        <div className="border-t-strict pt-4">
          <div className="border-strict p-3">
            <p className="text-sm font-sans text-gray-800 leading-relaxed">
              🔄 Work in progress. You'll be able to confirm service receipt once the worker completes the job.
            </p>
          </div>
        </div>
      )}

      {isEmployer && job.worker_approved && job.employer_approved && (
        <div className="border-t-strict pt-4">
          <div className="border-strict p-3">
            <p className="text-sm font-sans text-gray-800 leading-relaxed">
              ✅ Service confirmed! Payment has been released to the worker.
            </p>
          </div>
        </div>
      )}

      {job.status === 'approved' && (
        <div className="border-t-strict pt-4">
          <div className="border-strict p-3">
            <p className="text-sm font-sans text-gray-800 leading-relaxed">
              🎉 Both parties approved! Job completed successfully and payment released.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default JobManager