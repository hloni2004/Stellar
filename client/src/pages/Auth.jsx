import { useState } from 'react'
import Login from '../components/Login'
import SignUp from '../components/SignUp'

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-2xl border-strict bg-paper">
        <div className="border-b-strict px-6 py-4">
          <h1 className="font-sans font-black uppercase tracking-tighter leading-tight text-3xl">
            SkillLink Africa
          </h1>
          <p className="mt-2 font-sans text-gray-800 leading-relaxed text-sm">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>
        <div className="px-6 py-6">
          {isLogin ? (
            <Login onSwitchToSignup={() => setIsLogin(false)} />
          ) : (
            <SignUp onSwitchToLogin={() => setIsLogin(true)} />
          )}
        </div>
      </div>
    </div>
  )
}

export default Auth