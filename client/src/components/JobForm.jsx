import { useState } from 'react'
import { useApp } from '../context/AppContext'

const JobForm = ({ onJobCreated, onCancel }) => {
  const { publicKey, user } = useApp()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'programming',
    location: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const categories = [
    'programming',
    'design',
    'writing',
    'marketing',
    'consulting',
    'tutoring',
    'artisan',
    'other'
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!publicKey) {
      alert('Please connect your wallet first')
      return
    }

    if (!user) {
      alert('Please log in to create a job')
      return
    }

    setIsSubmitting(true)
    try {
      console.log('Creating job with user:', user.id)
      
      const response = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category,
          location: formData.location,
          worker_public_key: publicKey,
          user_id: user.id // Add user ID from authentication
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create job')
      }

      const newJob = await response.json()
      console.log('Job created successfully:', newJob)
      onJobCreated(newJob)
      setFormData({ title: '', description: '', price: '', category: 'programming', location: '' })
    } catch (error) {
      console.error('Error creating job:', error)
      alert(`Failed to create job: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div>
      {user && (
        <div className="mb-6 border-strict px-4 py-3">
          <div className="font-mono text-xs uppercase">Posting As</div>
          <p className="font-sans font-black uppercase tracking-tight mt-1">{user.full_name || user.email}</p>
          <p className="font-sans text-gray-800 leading-relaxed text-sm mt-1">Your job will be visible to all freelancers.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block font-mono text-xs uppercase mb-2">
              Job Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="bg-transparent border-b-strict border-ink outline-none py-3 font-mono text-lg focus:border-safety transition-colors rounded-none w-full"
              placeholder="Senior React Developer for E-commerce Platform"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-mono text-xs uppercase mb-2">
              Project Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={5}
              className="bg-transparent border-b-strict border-ink outline-none py-3 font-sans text-base text-gray-800 leading-relaxed focus:border-safety transition-colors rounded-none w-full resize-none"
              placeholder="Describe requirements, timeline, and deliverables."
            />
          </div>

          <div>
            <label className="block font-mono text-xs uppercase mb-2">
              Budget (XLM) *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              min="1"
              step="0.1"
              className="bg-transparent border-b-strict border-ink outline-none py-3 font-mono text-lg focus:border-safety transition-colors rounded-none w-full"
              placeholder="100.0"
            />
            <p className="font-sans text-gray-800 leading-relaxed text-xs mt-2">Funds are escrowed until completion.</p>
          </div>

          <div>
            <label className="block font-mono text-xs uppercase mb-2">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="bg-transparent border-b-strict border-ink outline-none py-3 font-mono text-lg focus:border-safety transition-colors rounded-none w-full"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block font-mono text-xs uppercase mb-2">
              Location *
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              className="bg-transparent border-b-strict border-ink outline-none py-3 font-mono text-lg focus:border-safety transition-colors rounded-none w-full"
              placeholder="Lagos, Nigeria or Remote"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t-strict">
          <button
            type="button"
            onClick={onCancel}
            className="bg-transparent text-ink border-strict hover:bg-ink hover:text-paper px-8 py-3 font-bold uppercase text-sm tracking-wide transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !user}
            className="bg-ink text-paper hover:bg-safety px-8 py-3 font-bold uppercase text-sm tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating Job...' : 'Publish Job'}
          </button>
        </div>

      </form>

      {!user && (
        <div className="mt-6 border-strict px-4 py-3">
          <p className="font-sans font-black uppercase tracking-tight text-sm">Authentication Required</p>
          <p className="font-sans text-gray-800 leading-relaxed text-sm mt-1">Please sign in to create and manage job listings.</p>
        </div>
      )}
    </div>
  )
}

export default JobForm