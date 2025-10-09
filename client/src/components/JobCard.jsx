import { useState } from 'react'
import { useApp } from '../context/AppContext'
import HireWorker from './HireWorker'

const JobCard = ({ job }) => {
  const { publicKey } = useApp()
  const [showHireModal, setShowHireModal] = useState(false)

  const isOwnJob = publicKey === job.worker_public_key

  const canHire = !isOwnJob && publicKey

  const openHire = () => {
    if (canHire) setShowHireModal(true)
  }

  const onKeyDown = (e) => {
    if (!canHire) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setShowHireModal(true)
    }
  }

  return (
    <>
      <div
        onClick={openHire}
        onKeyDown={onKeyDown}
        tabIndex={canHire ? 0 : -1}
        role={canHire ? 'button' : undefined}
        className={`bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow ${canHire ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500' : ''}`}
      >
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
            {job.category}
          </span>
        </div>
        
        <p className="text-gray-600 mb-4">{job.description}</p>
        
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-500">
            <span className="font-medium">Location:</span> {job.location}
          </div>
          <div className="text-lg font-bold text-green-600">
            {job.price} XLM
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Posted by: {job.worker_public_key.slice(0, 8)}...
          </div>
          
          {!isOwnJob && publicKey && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowHireModal(true) }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Hire
            </button>
          )}
          
          {isOwnJob && (
            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
              Your Job
            </span>
          )}
        </div>
  </div>

      {showHireModal && (
        <HireWorker job={job} onClose={() => setShowHireModal(false)} />
      )}
    </>
  )
}

export default JobCard