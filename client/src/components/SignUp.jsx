import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const SignUp = ({ onSwitchToLogin }) => {
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    skills: '',
    location: '',
    public_key: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          skills: formData.skills.split(',').map(skill => skill.trim())
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Signup failed')
      }

      const data = await response.json()
      login(data.user)
      
    } catch (error) {
      console.error('Signup error:', error)
      alert(`Signup failed: ${error.message}`)
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
    <div className="max-w-2xl mx-auto">
      <h2 className="font-sans font-black uppercase tracking-tighter leading-tight text-2xl mb-6">Join SkillLink Africa</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-mono text-xs uppercase mb-2">
            Full Name
          </label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            required
            className="bg-transparent border-b-strict border-ink outline-none py-3 font-mono text-lg focus:border-safety transition-colors rounded-none w-full"
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <label className="block font-mono text-xs uppercase mb-2">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="bg-transparent border-b-strict border-ink outline-none py-3 font-mono text-lg focus:border-safety transition-colors rounded-none w-full"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label className="block font-mono text-xs uppercase mb-2">
            Password
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength="6"
            className="bg-transparent border-b-strict border-ink outline-none py-3 font-mono text-lg focus:border-safety transition-colors rounded-none w-full"
            placeholder="Create a password"
          />
        </div>

        <div>
          <label className="block font-mono text-xs uppercase mb-2">
            Skills (comma separated)
          </label>
          <input
            type="text"
            name="skills"
            value={formData.skills}
            onChange={handleChange}
            className="bg-transparent border-b-strict border-ink outline-none py-3 font-mono text-lg focus:border-safety transition-colors rounded-none w-full"
            placeholder="e.g., React, Design, Writing"
          />
        </div>

        <div>
          <label className="block font-mono text-xs uppercase mb-2">
            Location
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="bg-transparent border-b-strict border-ink outline-none py-3 font-mono text-lg focus:border-safety transition-colors rounded-none w-full"
            placeholder="e.g., Lagos, Nigeria"
          />
        </div>

        <div>
          <label className="block font-mono text-xs uppercase mb-2">
            Stellar Public Key (Optional)
          </label>
          <input
            type="text"
            name="public_key"
            value={formData.public_key}
            onChange={handleChange}
            className="bg-transparent border-b-strict border-ink outline-none py-3 font-mono text-lg focus:border-safety transition-colors rounded-none w-full"
            placeholder="G..."
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-ink text-paper hover:bg-safety px-8 py-3 font-bold uppercase text-sm tracking-wide transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <p className="font-sans text-gray-800 leading-relaxed text-sm">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="font-bold uppercase text-xs tracking-wide underline"
          >
            Log In
          </button>
        </p>
      </div>
    </div>
  )
}

export default SignUp