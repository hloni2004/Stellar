import { supabase } from '../models/supabaseClient.js'
import bcrypt from 'bcryptjs'

export const signup = async (req, res) => {
  try {
    const { email, password, full_name, public_key, skills, location } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Hash password
    const saltRounds = 10
    const password_hash = await bcrypt.hash(password, saltRounds)

    // Create user in Supabase
    const { data: user, error } = await supabase
      .from('users')
      .insert([{
        email,
        password_hash,
        full_name,
        public_key,
        skills: skills || [],
        location
      }])
      .select()
      .single()

    if (error) {
      console.error('Signup error:', error)
      return res.status(400).json({ error: error.message })
    }

    // Remove password from response
    const { password_hash: _, ...userWithoutPassword } = user

    res.status(201).json({
      message: 'User created successfully',
      user: userWithoutPassword
    })

  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({ error: 'Failed to create user' })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash)
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Remove password from response
    const { password_hash: _, ...userWithoutPassword } = user

    res.json({
      message: 'Login successful',
      user: userWithoutPassword
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Failed to login' })
  }
}

export const getProfile = async (req, res) => {
  try {
    const { userId } = req.params

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, public_key, skills, location, created_at')
      .eq('id', userId)
      .single()

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(user)

  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ error: 'Failed to get profile' })
  }
}