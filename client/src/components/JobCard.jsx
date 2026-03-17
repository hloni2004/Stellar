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
        className={`grid gap-4 px-5 py-5 border-b-strict transition-colors ${canHire ? 'cursor-pointer hover:bg-paperHover focus:outline-none bg-paper' : 'bg-paper'}`}
      >
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
          <h3 className="font-sans font-black uppercase tracking-tighter leading-tight text-xl">{job.title}</h3>
          <span className="font-mono text-xs uppercase border-strict px-3 py-1 whitespace-nowrap">
            {job.category}
          </span>
        </div>

        <p className="font-sans text-gray-800 leading-relaxed line-clamp-3">{job.description}</p>

        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <div className="font-mono text-xs uppercase">Location</div>
            <div className="font-sans font-bold uppercase tracking-tight text-sm mt-1">{job.location}</div>
          </div>
          <div>
            <div className="font-mono text-xs uppercase">Budget</div>
            <div className="font-mono text-lg font-bold mt-1">{job.price} XLM</div>
          </div>
          <div>
            <div className="font-mono text-xs uppercase">Worker Key</div>
            <div className="font-mono text-xs mt-1">{job.worker_public_key.slice(0, 12)}...</div>
          </div>
        </div>

        <div className="flex justify-end items-center gap-3 pt-1">
          {!isOwnJob && publicKey && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowHireModal(true) }}
              className="bg-ink text-paper hover:bg-safety px-6 py-2 font-bold uppercase text-xs tracking-wide transition-colors"
            >
              Hire Now
            </button>
          )}

          {isOwnJob && (
            <span className="font-mono text-xs uppercase border-strict px-3 py-2">
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