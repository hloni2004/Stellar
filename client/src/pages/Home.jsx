import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import JobCard from '../components/JobCard'
import JobForm from '../components/JobForm'

const Home = () => {
  const { publicKey } = useApp()
  const [jobs, setJobs] = useState([])
  const [showJobForm, setShowJobForm] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs')
      if (response.ok) {
        const jobsData = await response.json()
        setJobs(jobsData)
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJobCreated = (newJob) => {
    setJobs(prev => [newJob, ...prev])
    setShowJobForm(false)
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <section className="border-b-strict">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 grid gap-6 lg:grid-cols-[1fr_auto] items-start">
          <div className="grid gap-3">
            <h1 className="font-sans font-black uppercase tracking-tighter leading-tight text-4xl lg:text-5xl">Secure African Freelance Ledger</h1>
            <p className="font-sans text-gray-800 leading-relaxed max-w-3xl">
              Post work, hire talent, and lock funds in blockchain escrow. Every agreement is tracked as a
              visible financial workflow.
            </p>
            <div className="grid sm:grid-cols-3 border-strict">
              <div className="px-4 py-3 border-b-strict sm:border-b-0 sm:border-r-strict">
                <div className="font-mono text-xs uppercase">Feature</div>
                <div className="font-sans font-bold uppercase tracking-tight text-sm">Secure Escrow</div>
              </div>
              <div className="px-4 py-3 border-b-strict sm:border-b-0 sm:border-r-strict">
                <div className="font-mono text-xs uppercase">Feature</div>
                <div className="font-sans font-bold uppercase tracking-tight text-sm">Dual Approval</div>
              </div>
              <div className="px-4 py-3">
                <div className="font-mono text-xs uppercase">Feature</div>
                <div className="font-sans font-bold uppercase tracking-tight text-sm">Stellar Settlement</div>
              </div>
            </div>
          </div>

          {publicKey && (
            <button
              onClick={() => setShowJobForm(true)}
              className="bg-ink text-paper hover:bg-safety px-8 py-3 font-bold uppercase text-sm tracking-wide transition-colors"
            >
              Post a Job
            </button>
          )}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
        {showJobForm ? (
          <section className="border-strict bg-paper">
            <div className="border-b-strict px-6 py-3">
              <h2 className="font-sans font-black uppercase tracking-tighter leading-tight text-2xl">Create Job Posting</h2>
            </div>
            <div className="px-6 py-6">
              <JobForm onJobCreated={handleJobCreated} onCancel={() => setShowJobForm(false)} />
            </div>
          </section>
        ) : (
          <>
            {!publicKey && (
              <section className="border-strict bg-paper mb-8">
                <div className="px-6 py-4">
                  <h2 className="font-sans font-black uppercase tracking-tighter leading-tight text-lg">Wallet Required</h2>
                  <p className="font-sans text-gray-800 leading-relaxed mt-2">
                    Connect your Stellar wallet to post work, hire talent, and authorize escrow-backed payments.
                  </p>
                </div>
              </section>
            )}

            <section className="border-strict bg-paper">
              <div className="border-b-strict px-6 py-4 grid gap-2 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <h2 className="font-sans font-black uppercase tracking-tighter leading-tight text-2xl">Available Opportunities</h2>
                  <p className="font-mono text-sm mt-1">
                    {loading ? 'Loading ledger rows...' : `${jobs.length} active job${jobs.length !== 1 ? 's' : ''}`}
                  </p>
                </div>
                <div className="font-mono text-xs uppercase flex items-center gap-2">
                  <span className="w-2 h-2 bg-soroban rounded-full"></span>
                  Live Feed
                </div>
              </div>

              <div>
                {loading ? (
                  <div className="px-6 py-12 font-mono text-sm">Loading opportunities from secure ledger...</div>
                ) : jobs.length === 0 ? (
                  <div className="px-6 py-12">
                    <h3 className="font-sans font-black uppercase tracking-tighter leading-tight text-xl">No Open Jobs</h3>
                    <p className="font-sans text-gray-800 leading-relaxed mt-2">Publish the first opportunity to start marketplace activity.</p>
                    {publicKey && (
                      <button
                        onClick={() => setShowJobForm(true)}
                        className="mt-4 bg-ink text-paper hover:bg-safety px-8 py-3 font-bold uppercase text-sm tracking-wide transition-colors"
                      >
                        Post First Job
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="border-t-strict">
                    {jobs.map(job => (
                      <JobCard key={job.id} job={job} />
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}

export default Home