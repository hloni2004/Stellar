import { useState } from 'react'
import Login from '../components/Login'
import SignUp from '../components/SignUp'

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-center text-blue-600">
            SkillLink Africa
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        {isLogin ? (
          <Login onSwitchToSignup={() => setIsLogin(false)} />
        ) : (
          <SignUp onSwitchToLogin={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  )
}

export default Auth