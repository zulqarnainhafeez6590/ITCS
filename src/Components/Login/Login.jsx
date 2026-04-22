import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMsal } from '@azure/msal-react'
import { loginRequest } from '../../config/msalConfig'
import alignitLogo from '../../assets/logos/itcsLogo.png'
import './Login.scss'

const Login = () => {
  const navigate = useNavigate()
  const { instance } = useMsal()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    // Check if user already has a token (already logged in)
    const token = localStorage.getItem('token')
    if (token) {
      navigate('/admin', { replace: true })
      return
    }

    const accounts = instance.getAllAccounts()
    if (accounts.length > 0 && !token) {
      instance.clearCache()
    }
  }, [instance, navigate])

  const handleMicrosoftLogin = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await instance.loginPopup(loginRequest)
      await handleMicrosoftLoginSuccess(response.account)
    } catch (err) {
      console.error('Login error:', err)
      setError(err.message || 'Failed to sign in with Microsoft 365')
      setLoading(false)
    }
  }

  const handleMicrosoftLoginSuccess = async (account) => {
    try {
      const tokenResponse = await instance.acquireTokenSilent({
        ...loginRequest,
        account: account,
      })

      const response = await fetch('http://localhost:5000/api/auth/microsoft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: tokenResponse.accessToken,
          email: account.username,
          name: account.name,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Authentication failed.')

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('email', data.user.email)

      navigate('/admin')
    } catch (err) {
      console.error('Backend authentication error:', err)
      setError(err.message || 'Failed to authenticate with server')
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg-overlay" />
      <div className="login-container">
        <div className="login-card">
          <div className="card-header">
            <img src={alignitLogo} alt="ITCS Logo" className="login-logo" />
            <p className="card-subtitle">Admin Dashboard Access</p>
          </div>

          <div className="login-body">
            {error && (
              <div className="error-alert">
                {error}
              </div>
            )}

            <div className="auth-options">
              <button 
                className="microsoft-login-btn" 
                onClick={handleMicrosoftLogin}
                disabled={loading}
              >
                <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="0.5" y="0.5" width="9" height="9" fill="#F25022"/>
                  <rect x="10.5" y="0.5" width="9" height="9" fill="#7FBA00"/>
                  <rect x="0.5" y="10.5" width="9" height="9" fill="#00A4EF"/>
                  <rect x="10.5" y="10.5" width="9" height="9" fill="#FFB900"/>
                </svg>
                {loading ? 'Authenticating...' : 'Sign in with Microsoft 365'}
              </button>
            </div>
          </div>

          <div className="card-footer">
            <button className="home-link" onClick={() => navigate('/')}>
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
