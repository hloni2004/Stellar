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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Find Local Talent</h1>
          <p className="text-gray-600 mt-2">
            Connect with skilled freelancers, students, and artisans across Africa
          </p>
        </div>
        
        {publicKey && (
          <button
            onClick={() => setShowJobForm(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Post a Job
          </button>
        )}
      </div>

      {showJobForm ? (
        <div className="mb-8">
          <JobForm 
            onJobCreated={handleJobCreated}
            onCancel={() => setShowJobForm(false)}
          />
        </div>
      ) : (
        <>
          {!publicKey && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-yellow-800 mb-2">
                Connect Your Wallet
              </h2>
              <p className="text-yellow-700">
                Please connect your Stellar wallet to post jobs or hire workers.
              </p>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Available Jobs ({jobs.length})
            </h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading jobs...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-lg">No jobs available yet.</p>
                <p className="text-gray-400 mt-2">Be the first to post a job!</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {jobs.map(job => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Home