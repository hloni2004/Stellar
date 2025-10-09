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
        
        // For employer jobs, we need to check payments table
        const myPayments = await fetch(`/api/payments/history?publicKey=${publicKey}`)
        const paymentsData = myPayments.ok ? await myPayments.json() : []
        const myEmployerJobIds = paymentsData
          .filter(payment => payment.client_public_key === publicKey)
          .map(payment => payment.job_id)
        
        const myPostedJobs = allJobs.filter(job => myEmployerJobIds.includes(job.id))
        
        const availableJobs = allJobs.filter(job => 
          job.status === 'open' && 
          job.worker_public_key !== publicKey &&
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
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600">Please connect your Stellar wallet to view your jobs.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading jobs...</p>
        </div>
      </div>
    )
  }

  const jobs = getJobsByTab()

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Jobs</h1>
        <p className="text-gray-600">Manage your work, posted jobs, and find new opportunities</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('my-work')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'my-work'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Work ({myWorkJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('my-posts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'my-posts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Posts ({myPostedJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('available')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'available'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Available Jobs ({availableJobs.length})
          </button>
        </nav>
      </div>

      {/* Job List */}
      <div className="space-y-6">
        {jobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'my-work' && 'No work assignments yet'}
              {activeTab === 'my-posts' && 'No job posts yet'}
              {activeTab === 'available' && 'No available jobs'}
            </h3>
            <p className="text-gray-600">
              {activeTab === 'my-work' && 'Start browsing available jobs to find work opportunities.'}
              {activeTab === 'my-posts' && 'Create your first job post to find skilled workers.'}
              {activeTab === 'available' && 'Check back later for new job opportunities.'}
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'available' ? (
              // Show regular job cards for available jobs
              jobs.map(job => (
                <JobCard key={job.id} job={job} />
              ))
            ) : (
              // Show detailed job manager for user's own jobs
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

      {/* Quick Actions */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-medium text-blue-900 mb-2">Need Work Done?</h3>
          <p className="text-sm text-blue-700 mb-4">
            Post a job and connect with skilled professionals in your area.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Post a Job
          </button>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="font-medium text-green-900 mb-2">Looking for Work?</h3>
          <p className="text-sm text-green-700 mb-4">
            Browse available jobs and start earning XLM for your skills.
          </p>
          <button 
            onClick={() => setActiveTab('available')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
          >
            Browse Jobs
          </button>
        </div>
      </div>
    </div>
  )
}

export default MyJobs