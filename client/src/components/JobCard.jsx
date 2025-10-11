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
        className={`bg-white rounded-xl shadow-md p-6 border border-slate-200 hover:shadow-xl transition-all duration-200 hover:border-slate-300 ${canHire ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 hover:-translate-y-1' : ''}`}
      >
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-slate-800 line-clamp-2">{job.title}</h3>
          <span className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-sm font-semibold rounded-full whitespace-nowrap ml-2">
            {job.category}
          </span>
        </div>
        
        <p className="text-slate-600 mb-4 line-clamp-3 leading-relaxed">{job.description}</p>
        
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-slate-500 flex items-center">
            <svg className="w-4 h-4 mr-1.5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{job.location}</span>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 rounded-lg border border-green-200">
            <span className="text-lg font-bold text-green-700">{job.price}</span>
            <span className="text-sm font-medium text-green-600 ml-1">XLM</span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-slate-500 flex items-center">
            <div className="w-6 h-6 bg-gradient-to-r from-slate-400 to-slate-500 rounded-full flex items-center justify-center mr-2">
              <span className="text-white text-xs font-medium">
                {job.worker_public_key.slice(0, 1).toUpperCase()}
              </span>
            </div>
            <span className="font-mono text-xs">{job.worker_public_key.slice(0, 12)}...</span>
          </div>
          
          {!isOwnJob && publicKey && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowHireModal(true) }}
              className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414-1.414L9 5.586 7.707 4.293a1 1 0 00-1.414 1.414L8.586 8H5a1 1 0 100 2h3.586l-2.293 2.293a1 1 0 101.414 1.414L9 12.414l.293.293a1 1 0 001.414-1.414L8.414 10H12a1 1 0 100-2H8.414l2.293-2.293z" clipRule="evenodd" />
              </svg>
              <span>Hire Now</span>
            </button>
          )}
          
          {isOwnJob && (
            <span className="px-4 py-2 bg-slate-100 text-slate-600 text-sm rounded-lg font-medium border border-slate-200">
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