import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'

const JobManager = ({ job, onJobUpdate }) => {
  const { publicKey } = useApp()
  const [loading, setLoading] = useState(false)
  const [completionNotes, setCompletionNotes] = useState('')
  const [paymentStatus, setPaymentStatus] = useState(null)

  // Check if current user is the worker
  const isWorker = publicKey === job.worker_public_key
  // Check if current user is the employer (client who made payment)
  const isEmployer = paymentStatus && paymentStatus.payment_status !== 'not_paid' && 
                     publicKey && paymentStatus.client_public_key === publicKey

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
        const updatedJob = await response.json()
        onJobUpdate(updatedJob)
        alert('Job marked as completed! Waiting for employer approval.')
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

  const handleApproveCompletion = async () => {
    if (!isEmployer) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/jobs/${job.id}/approve`, {
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
        alert(`Job approved! Payment of ${result.payment_released} XLM has been released to the worker.`)
        fetchPaymentStatus() // Refresh payment status
      } else {
        const error = await response.json()
        alert(`Failed to approve job: ${error.error}`)
      }
    } catch (error) {
      console.error('Error approving job:', error)
      alert('Failed to approve job completion')
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
      case 'completed': return 'Completed - Awaiting Approval'
      case 'approved': return 'Approved & Paid'
      default: return status
    }
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
            {paymentStatus.payment_status === 'paid' && (
              <div>Status: <span className="font-medium text-green-600">Payment Released</span></div>
            )}
          </div>
        </div>
      )}

      {/* Completion Notes Display */}
      {job.completion_notes && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-700 mb-2">Completion Notes</h4>
          <p className="text-sm text-blue-600">{job.completion_notes}</p>
        </div>
      )}

      {/* Worker Actions */}
      {isWorker && job.status === 'in_progress' && (
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-700 mb-3">Complete Job</h4>
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
            {loading ? 'Submitting...' : 'Mark as Completed'}
          </button>
        </div>
      )}

      {/* Employer Actions */}
      {isEmployer && job.status === 'completed' && (
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-700 mb-3">Approve Completion</h4>
          <p className="text-sm text-gray-600 mb-3">
            Review the completed work and approve to release payment to the worker.
          </p>
          <button
            onClick={handleApproveCompletion}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Approving...' : 'Approve & Release Payment'}
          </button>
        </div>
      )}

      {/* Status Messages */}
      {isWorker && job.status === 'completed' && (
        <div className="border-t pt-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-700">
              ⏳ Job completed! Waiting for employer approval to receive payment.
            </p>
          </div>
        </div>
      )}

      {isEmployer && job.status === 'in_progress' && (
        <div className="border-t pt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              🔄 Work in progress. You'll be able to approve once the worker marks it as completed.
            </p>
          </div>
        </div>
      )}

      {job.status === 'approved' && (
        <div className="border-t pt-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-700">
              ✅ Job completed and payment released successfully!
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default JobManager