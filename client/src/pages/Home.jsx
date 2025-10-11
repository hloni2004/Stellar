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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="flex flex-col lg:flex-row justify-between items-center">
            <div className="lg:w-2/3 mb-8 lg:mb-0">
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
                Find Africa's Best
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                  Digital Talent
                </span>
              </h1>
              <p className="text-xl text-blue-100 leading-relaxed max-w-2xl">
                Connect with skilled freelancers, developers, designers, and innovators across Africa. 
                Secure payments powered by blockchain technology.
              </p>
              
              <div className="flex flex-wrap items-center gap-6 mt-8">
                <div className="flex items-center space-x-2 text-blue-100">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="font-medium">Secure Escrow</span>
                </div>
                <div className="flex items-center space-x-2 text-blue-100">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span className="font-medium">Instant Payments</span>
                </div>
                <div className="flex items-center space-x-2 text-blue-100">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="font-medium">Verified Talent</span>
                </div>
              </div>
            </div>
            
            {publicKey && (
              <div className="lg:w-1/3 lg:pl-8">
                <button
                  onClick={() => setShowJobForm(true)}
                  className="w-full lg:w-auto px-8 py-4 bg-white text-slate-800 rounded-xl hover:bg-slate-50 transition-all duration-200 font-semibold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center space-x-3"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  <span>Post a Job</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">{showJobForm ? (
        <div className="mb-12">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
              <h2 className="text-2xl font-bold text-white">Create New Job Posting</h2>
              <p className="text-slate-300 mt-2">Share your project details and find the perfect freelancer</p>
            </div>
            <div className="p-8">
              <JobForm 
                onJobCreated={handleJobCreated}
                onCancel={() => setShowJobForm(false)}
              />
            </div>
          </div>
        </div>
      ) : (
        <>
          {!publicKey && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-8 mb-12 shadow-lg">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-amber-800 mb-2">
                    Connect Your Stellar Wallet
                  </h2>
                  <p className="text-amber-700 leading-relaxed">
                    To post jobs or hire talented freelancers, please connect your Stellar wallet. 
                    This ensures secure payments and protects both clients and workers.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Jobs Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-8 py-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    Available Opportunities
                  </h2>
                  <p className="text-slate-600 mt-1">
                    {loading ? 'Loading...' : `${jobs.length} active job${jobs.length !== 1 ? 's' : ''} available`}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-slate-600 font-medium">Live Updates</span>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              {loading ? (
                <div className="text-center py-16">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                    <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-purple-600 rounded-full animate-ping mx-auto"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 mt-6">Loading Opportunities</h3>
                  <p className="text-slate-500 mt-2">Fetching the latest jobs from talented professionals...</p>
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8zM16 10h.01" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-700 mb-3">No Jobs Available Yet</h3>
                  <p className="text-slate-500 text-lg mb-6 max-w-md mx-auto">
                    Be the pioneer! Post the first job and start building Africa's digital workforce.
                  </p>
                  {publicKey && (
                    <button
                      onClick={() => setShowJobForm(true)}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                    >
                      Post the First Job
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                  {jobs.map(job => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  )
}

export default Home