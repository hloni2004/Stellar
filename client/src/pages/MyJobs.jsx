import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import JobManager from '../components/JobManager'
import JobCard from '../components/JobCard'

const MyJobs = () => {
  const { publicKey } = useApp()
  const [myWorkJobs, setMyWorkJobs] = useState([])
  const [myPostedJobs, setMyPostedJobs] = useState([])
  const [availableJobs, setAvailableJobs] = useState([])
  const [activeTab, setActiveTab] = useState('my-work') // 'my-work', 'my-posts', 'available'
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (publicKey) {
      fetchJobs()
    }
  }, [publicKey])

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/jobs')
      if (response.ok) {
        const allJobs = await response.json()
        
        // Filter jobs based on user role
        const myWorkJobs = allJobs.filter(job => job.worker_public_key === publicKey)
        
        // For employer jobs, check both employer_public_key field and payments table
        let myPostedJobs = []
        
        // First, get jobs using employer_public_key field (after migration)
        const jobsWithEmployerKey = allJobs.filter(job => job.employer_public_key === publicKey)
        
        // Then, get jobs from payments table (before/during migration)
        const myPayments = await fetch(`/api/payments/history?publicKey=${publicKey}`)
        const paymentsData = myPayments.ok ? await myPayments.json() : []
        const myEmployerJobIds = paymentsData
          .filter(payment => payment.client_public_key === publicKey)
          .map(payment => payment.job_id)
        
        const jobsFromPayments = allJobs.filter(job => myEmployerJobIds.includes(job.id))
        
        // Combine and deduplicate
        const allEmployerJobs = [...jobsWithEmployerKey, ...jobsFromPayments]
        myPostedJobs = allEmployerJobs.filter((job, index, self) => 
          index === self.findIndex(j => j.id === job.id)
        )
        
        const availableJobs = allJobs.filter(job => 
          job.status === 'open' && 
          job.worker_public_key !== publicKey &&
          job.employer_public_key !== publicKey &&
          !myEmployerJobIds.includes(job.id)
        )
        
        setMyWorkJobs(myWorkJobs)
        setMyPostedJobs(myPostedJobs)
        setAvailableJobs(availableJobs)
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJobUpdate = (updatedJob) => {
    setMyWorkJobs(prev => prev.map(job => 
      job.id === updatedJob.id ? updatedJob : job
    ))
    setMyPostedJobs(prev => prev.map(job => 
      job.id === updatedJob.id ? updatedJob : job
    ))
    fetchJobs() // Refresh to get latest data
  }

  const getJobsByTab = () => {
    switch (activeTab) {
      case 'my-work':
        return myWorkJobs
      case 'my-posts':
        return myPostedJobs
      case 'available':
        return availableJobs
      default:
        return []
    }
  }

  if (!publicKey) {
    return (
      <div className="max-w-6xl mx-auto p-4 lg:p-6">
        <div className="border-strict bg-paper px-6 py-10">
          <h2 className="font-sans font-black uppercase tracking-tighter leading-tight text-2xl mb-2">Connect Your Wallet</h2>
          <p className="font-sans text-gray-800 leading-relaxed">Please connect your Stellar wallet to view your jobs.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4 lg:p-6">
        <div className="border-strict bg-paper px-6 py-10 font-mono text-sm">Loading jobs...</div>
      </div>
    )
  }

  const jobs = getJobsByTab()

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-6">
      <div className="mb-8 border-strict bg-paper px-6 py-5">
        <h1 className="font-sans font-black uppercase tracking-tighter leading-tight text-3xl mb-1">My Jobs</h1>
        <p className="font-sans text-gray-800 leading-relaxed">Manage your work, posted jobs, and open opportunities.</p>
      </div>

      <div className="border-strict bg-paper mb-6">
        <nav className="grid md:grid-cols-3">
          <button
            onClick={() => setActiveTab('my-work')}
            className={`py-3 px-4 border-b-strict md:border-b-0 md:border-r-strict font-bold uppercase text-xs tracking-wide transition-colors ${
              activeTab === 'my-work' ? 'bg-ink text-paper' : 'bg-transparent text-ink hover:bg-paperHover'
            }`}
          >
            My Work ({myWorkJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('my-posts')}
            className={`py-3 px-4 border-b-strict md:border-b-0 md:border-r-strict font-bold uppercase text-xs tracking-wide transition-colors ${
              activeTab === 'my-posts' ? 'bg-ink text-paper' : 'bg-transparent text-ink hover:bg-paperHover'
            }`}
          >
            My Posts ({myPostedJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('available')}
            className={`py-3 px-4 font-bold uppercase text-xs tracking-wide transition-colors ${
              activeTab === 'available' ? 'bg-ink text-paper' : 'bg-transparent text-ink hover:bg-paperHover'
            }`}
          >
            Available Jobs ({availableJobs.length})
          </button>
        </nav>
      </div>

      <div className="space-y-4 border-strict bg-paper">
        {jobs.length === 0 ? (
          <div className="px-6 py-12">
            <h3 className="font-sans font-black uppercase tracking-tighter leading-tight text-lg mb-2">
              {activeTab === 'my-work' && 'No work assignments yet'}
              {activeTab === 'my-posts' && 'No job posts yet'}
              {activeTab === 'available' && 'No available jobs'}
            </h3>
            <p className="font-sans text-gray-800 leading-relaxed">
              {activeTab === 'my-work' && 'Start browsing available jobs to find work opportunities.'}
              {activeTab === 'my-posts' && 'Create your first job post to find skilled workers.'}
              {activeTab === 'available' && 'Check back later for new job opportunities.'}
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'available' ? (
              jobs.map(job => (
                <JobCard key={job.id} job={job} />
              ))
            ) : (
              jobs.map(job => (
                <JobManager 
                  key={job.id} 
                  job={job} 
                  onJobUpdate={handleJobUpdate}
                />
              ))
            )}
          </>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border-strict bg-paper p-6">
          <h3 className="font-sans font-black uppercase tracking-tight text-sm mb-2">Need Work Done?</h3>
          <p className="font-sans text-gray-800 leading-relaxed text-sm mb-4">
            Post a job and connect with skilled professionals in your area.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-ink text-paper hover:bg-safety px-4 py-2 font-bold uppercase text-xs tracking-wide transition-colors"
          >
            Post a Job
          </button>
        </div>

        <div className="border-strict bg-paper p-6">
          <h3 className="font-sans font-black uppercase tracking-tight text-sm mb-2">Looking for Work?</h3>
          <p className="font-sans text-gray-800 leading-relaxed text-sm mb-4">
            Browse available jobs and start earning XLM for your skills.
          </p>
          <button 
            onClick={() => setActiveTab('available')}
            className="bg-transparent text-ink border-strict hover:bg-ink hover:text-paper px-4 py-2 font-bold uppercase text-xs tracking-wide transition-colors"
          >
            Browse Jobs
          </button>
        </div>
      </div>
    </div>
  )
}

export default MyJobs