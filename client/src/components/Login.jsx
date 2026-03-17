import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const Login = ({ onSwitchToSignup }) => {
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Login failed')
      }

      const data = await response.json()
      login(data.user)
      
    } catch (error) {
      console.error('Login error:', error)
      alert(`Login failed: ${error.message}`)
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
      <h2 className="font-sans font-black uppercase tracking-tighter leading-tight text-2xl mb-6">Welcome Back</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
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
            className="bg-transparent border-b-strict border-ink outline-none py-3 font-mono text-lg focus:border-safety transition-colors rounded-none w-full"
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-ink text-paper hover:bg-safety px-8 py-3 font-bold uppercase text-sm tracking-wide transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <p className="font-sans text-gray-800 leading-relaxed text-sm">
          Don't have an account?{' '}
          <button
            onClick={onSwitchToSignup}
            className="font-bold uppercase text-xs tracking-wide underline"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  )
}

export default Login