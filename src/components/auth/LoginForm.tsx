import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNotification } from '../../contexts/NotificationContext'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { Building2 } from 'lucide-react'

export const LoginForm: React.FC = () => {
  const { signIn, signUp } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (isSignUp) {
      if (password !== confirmPassword) {
        showError('Password Mismatch', 'Passwords do not match')
        setIsLoading(false)
        return
      }
      
      if (password.length < 6) {
        showError('Password Too Short', 'Password must be at least 6 characters')
        setIsLoading(false)
        return
      }

      const { error } = await signUp(email, password)
      
      if (error) {
        showError('Sign Up Failed', error.message)
      } else {
        showSuccess('Account Created', 'Check your email for a confirmation link!')
      }
    } else {
      const { error } = await signIn(email, password)
      
      if (error) {
        showError('Sign In Failed', error.message)
      }
    }
    
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary-100 rounded-2xl">
              <Building2 className="h-8 w-8 text-primary-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Solution Gate Media</h1>
          <p className="text-gray-600 text-sm">Onboarding Docs Builder</p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={isLoading}
            />
            
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={isLoading}
            />
            
            {isSignUp && (
              <Input
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                disabled={isLoading}
              />
            )}
            
            <Button
              type="submit"
              className="w-full"
              loading={isLoading}
              disabled={!email || !password || (isSignUp && !confirmPassword)}
            >
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                className="text-primary-600 hover:text-primary-700 font-medium"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setEmail('')
                  setPassword('')
                  setConfirmPassword('')
                }}
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
