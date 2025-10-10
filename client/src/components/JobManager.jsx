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
      case 'open': return 'bg-gray-100 text-gray-800'
      case 'paid': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-orange-100 text-orange-800'
      case 'approved': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
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
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
        <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(job.status)}`}>
          {getStatusText(job.status)}
        </span>
      </div>
      
      <p className="text-gray-600 mb-4">{job.description}</p>
      
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span className="font-medium text-gray-700">Category:</span> {job.category}
        </div>
        <div>
          <span className="font-medium text-gray-700">Location:</span> {job.location}
        </div>
        <div>
          <span className="font-medium text-gray-700">Price:</span> 
          <span className="text-lg font-bold text-green-600 ml-2">{job.price} XLM</span>
        </div>
        <div>
          <span className="font-medium text-gray-700">Worker:</span> 
          {job.worker_public_key ? `${job.worker_public_key.slice(0, 8)}...` : 'Not assigned'}
        </div>
        {job.employer_public_key && (
          <div>
            <span className="font-medium text-gray-700">Employer:</span> 
            {job.employer_public_key.slice(0, 8)}...
          </div>
        )}
        {job.assigned_at && (
          <div>
            <span className="font-medium text-gray-700">Assigned:</span> 
            {new Date(job.assigned_at).toLocaleDateString()}
          </div>
        )}
        {job.completed_at && (
          <div>
            <span className="font-medium text-gray-700">Completed:</span> 
            {new Date(job.completed_at).toLocaleDateString()}
          </div>
        )}
        {job.approved_at && (
          <div>
            <span className="font-medium text-gray-700">Approved:</span> 
            {new Date(job.approved_at).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Payment Status */}
      {paymentStatus && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Payment Status</h4>
          <div className="text-sm text-gray-600">
            <div>Status: <span className="font-medium">{paymentStatus.payment_status}</span></div>
            {paymentStatus.amount && (
              <div>Amount: <span className="font-medium">{paymentStatus.amount} XLM</span></div>
            )}
            {paymentStatus.released_at ? (
              <div>Released: <span className="font-medium text-green-600">{new Date(paymentStatus.released_at).toLocaleString()}</span></div>
            ) : paymentStatus.payment_status === 'paid' ? (
              <div>Status: <span className="font-medium text-green-600">Payment Released</span></div>
            ) : null}
          </div>
        </div>
      )}

      {/* Dual Approval Status */}
      {(job.status === 'completed' || job.status === 'approved') && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-700 mb-2">Approval Status</h4>
          <div className="text-sm text-blue-600">
            <div>
              Worker Approval: 
              <span className={`ml-2 font-medium ${job.worker_approved ? 'text-green-600' : 'text-yellow-600'}`}>
                {job.worker_approved ? '✅ Completed' : '⏳ Pending'}
              </span>
            </div>
            <div>
              Employer Approval: 
              <span className={`ml-2 font-medium ${job.employer_approved ? 'text-green-600' : 'text-yellow-600'}`}>
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
        <div className="mb-4 p-3 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-700 mb-2">Work Completion Notes</h4>
          <p className="text-sm text-green-600">{job.completion_notes}</p>
        </div>
      )}

      {/* Worker Actions */}
      {/* Start Job Button - when job is paid and ready to start */}
      {isWorker && job.status === 'paid' && (
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-700 mb-3">Start Your Work</h4>
          <p className="text-sm text-gray-600 mb-3">
            Payment has been secured in escrow. Click below to start working on this job.
          </p>
          <button
            onClick={handleStartJob}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Starting...' : 'Start Job'}
          </button>
        </div>
      )}

      {/* Complete Job Button - when job is in progress and worker hasn't approved */}
      {isWorker && job.status === 'in_progress' && !job.worker_approved && (
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-700 mb-3">Complete & Approve Your Work</h4>
          <p className="text-sm text-gray-600 mb-3">
            Mark your work as completed and confirm you have finished the job.
          </p>
          <textarea
            value={completionNotes}
            onChange={(e) => setCompletionNotes(e.target.value)}
            placeholder="Add notes about the completed work (optional)"
            className="w-full p-3 border border-gray-300 rounded-lg resize-none"
            rows="3"
          />
          <button
            onClick={handleCompleteJob}
            disabled={loading}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Complete & Approve Work'}
          </button>
        </div>
      )}

      {/* Debug Info - Remove this after testing */}
      {isWorker && (
        <div className="border-t pt-4 bg-gray-50 p-3 rounded text-xs">
          <strong>Debug Info:</strong><br/>
          Status: {job.status}<br/>
          Worker Approved: {job.worker_approved ? 'true' : 'false'}<br/>
          Employer Approved: {job.employer_approved ? 'true' : 'false'}<br/>
          Show Complete Button: {(job.status === 'in_progress' && !job.worker_approved) ? 'YES' : 'NO'}
        </div>
      )}

      {/* Employer Actions */}
      {isEmployer && job.status === 'completed' && job.worker_approved && !job.employer_approved && (
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-700 mb-3">Confirm Service Receipt</h4>
          <p className="text-sm text-gray-600 mb-3">
            Review the completed work and confirm that you received the service to release payment.
          </p>
          {job.completion_notes && (
            <div className="mb-3 p-3 bg-gray-50 rounded border">
              <p className="text-sm font-medium text-gray-700">Worker's completion notes:</p>
              <p className="text-sm text-gray-600 mt-1">"{job.completion_notes}"</p>
            </div>
          )}
          <button
            onClick={handleEmployerApproval}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Confirming...' : 'Confirm Service & Release Payment'}
          </button>
        </div>
      )}

      {/* Status Messages */}
      {isWorker && job.worker_approved && !job.employer_approved && (
        <div className="border-t pt-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-700">
              ✅ You've completed the work! Waiting for employer to confirm they received the service.
            </p>
          </div>
        </div>
      )}

      {isEmployer && !job.worker_approved && (
        <div className="border-t pt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              🔄 Work in progress. You'll be able to confirm service receipt once the worker completes the job.
            </p>
          </div>
        </div>
      )}

      {isEmployer && job.worker_approved && job.employer_approved && (
        <div className="border-t pt-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-700">
              ✅ Service confirmed! Payment has been released to the worker.
            </p>
          </div>
        </div>
      )}

      {job.status === 'approved' && (
        <div className="border-t pt-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-700">
              🎉 Both parties approved! Job completed successfully and payment released.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default JobManager